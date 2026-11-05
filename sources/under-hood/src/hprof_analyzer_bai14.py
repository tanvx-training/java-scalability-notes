"""Bộ phân tích HPROF tối giản cho Bài 14 — làm đúng những phép tính cốt lõi của Eclipse MAT:
histogram, shallow/retained size, dominator tree (Cooper–Harvey–Kennedy), đường ngắn nhất tới GC root.

Giả định layout HotSpot 64-bit với compressed oops + compressed class pointers (heap < 32 GB):
header object 12 byte, header mảng 16 byte, tham chiếu 4 byte, căn 8 byte. Đây cũng là cách MAT ước lượng.
usage: python3 hprof.py dump.hprof [--path CLASSNAME] [--top N]
"""
import struct, sys, mmap, time, collections
import numpy as np

T_SIZE = {2: None, 4: 1, 5: 2, 6: 4, 7: 8, 8: 1, 9: 2, 10: 4, 11: 8}   # 2 = object
T_NAME = {4: 'boolean', 5: 'char', 6: 'float', 7: 'double', 8: 'byte', 9: 'short', 10: 'int', 11: 'long'}
REF = 4                                                                 # compressed oops

def align8(n): return (n + 7) & ~7

class Heap:
    def __init__(self, path):
        t0 = time.time()
        self.f = open(path, 'rb'); self.m = mmap.mmap(self.f.fileno(), 0, access=mmap.ACCESS_READ)
        m = self.m
        end = m.find(b'\0'); self.idsize = struct.unpack_from('>I', m, end + 1)[0]
        assert self.idsize == 8
        pos = end + 1 + 4 + 8
        self.strings = {}; self.class_name_id = {}
        self.classes = {}       # class id -> (super, [(name_id, type)], [(name_id, type, value)])
        ids, kinds, cls, offs, sizes = [], [], [], [], []      # per object
        roots = []
        root_kind = collections.Counter()
        ID = '>Q'
        while pos < len(m):
            tag = m[pos]; length = struct.unpack_from('>I', m, pos + 5)[0]; body = pos + 9; pos = body + length
            if tag == 0x01:
                sid = struct.unpack_from(ID, m, body)[0]
                self.strings[sid] = m[body + 8:body + length].decode('utf-8', 'replace')
            elif tag == 0x02:
                _, cid, _, nid = struct.unpack_from('>IQIQ', m, body)
                self.class_name_id[cid] = nid
            elif tag in (0x0C, 0x1C):
                p = body; e = body + length
                while p < e:
                    st = m[p]; p += 1
                    if st == 0xFF: roots.append(struct.unpack_from(ID, m, p)[0]); root_kind['unknown'] += 1; p += 8
                    elif st == 0x01: roots.append(struct.unpack_from(ID, m, p)[0]); root_kind['JNI global'] += 1; p += 16
                    elif st == 0x02: roots.append(struct.unpack_from(ID, m, p)[0]); root_kind['JNI local'] += 1; p += 16
                    elif st == 0x03: roots.append(struct.unpack_from(ID, m, p)[0]); root_kind['Java frame (biến cục bộ)'] += 1; p += 16
                    elif st == 0x04: roots.append(struct.unpack_from(ID, m, p)[0]); root_kind['native stack'] += 1; p += 12
                    elif st == 0x05: roots.append(struct.unpack_from(ID, m, p)[0]); root_kind['system class'] += 1; p += 8
                    elif st == 0x06: roots.append(struct.unpack_from(ID, m, p)[0]); root_kind['thread block'] += 1; p += 12
                    elif st == 0x07: roots.append(struct.unpack_from(ID, m, p)[0]); root_kind['monitor'] += 1; p += 8
                    elif st == 0x08: roots.append(struct.unpack_from(ID, m, p)[0]); root_kind['thread object'] += 1; p += 16
                    elif st == 0x20:
                        cid, _, sup = struct.unpack_from('>QIQ', m, p); p += 8 + 4 + 8 * 6 + 4
                        ncp = struct.unpack_from('>H', m, p)[0]; p += 2
                        for _ in range(ncp):
                            t = m[p + 2]; p += 3 + (8 if t == 2 else T_SIZE[t])
                        ns = struct.unpack_from('>H', m, p)[0]; p += 2
                        statics = []
                        for _ in range(ns):
                            nid = struct.unpack_from(ID, m, p)[0]; t = m[p + 8]; p += 9
                            if t == 2: statics.append((nid, t, struct.unpack_from(ID, m, p)[0])); p += 8
                            else: p += T_SIZE[t]
                        nf = struct.unpack_from('>H', m, p)[0]; p += 2
                        fields = []
                        for _ in range(nf):
                            nid = struct.unpack_from(ID, m, p)[0]; t = m[p + 8]; p += 9; fields.append((nid, t))
                        self.classes[cid] = (sup, fields, statics)
                        ids.append(cid); kinds.append(0); cls.append(cid); offs.append(0); sizes.append(8 * len(statics))
                    elif st == 0x21:
                        oid, _, cid, ln = struct.unpack_from('>QIQI', m, p)
                        ids.append(oid); kinds.append(1); cls.append(cid); offs.append(p + 24); sizes.append(ln); p += 24 + ln
                    elif st == 0x22:
                        oid, _, n, cid = struct.unpack_from('>QIIQ', m, p)
                        ids.append(oid); kinds.append(2); cls.append(cid); offs.append(p + 24); sizes.append(n); p += 24 + 8 * n
                    elif st == 0x23:
                        oid, _, n = struct.unpack_from('>QII', m, p); t = m[p + 16]
                        ids.append(oid); kinds.append(3); cls.append(-t); offs.append(0); sizes.append(align8(16 + n * T_SIZE[t])); p += 17 + n * T_SIZE[t]
                    else:
                        raise ValueError(f'subtag {st:#x} @ {p}')
        self.root_kind = root_kind
        # layout tính theo class
        self.layout = {}
        for cid in self.classes: self._layout(cid)
        order = np.argsort(np.array(ids, dtype=np.uint64), kind='stable')
        self.ids = np.array(ids, dtype=np.uint64)[order]
        self.kind = np.array(kinds, dtype=np.int8)[order]
        self.cls = np.array(cls, dtype=np.int64)[order]
        self.off = np.array(offs, dtype=np.int64)[order]
        raw = np.array(sizes, dtype=np.int64)[order]
        shallow = raw.copy()
        inst = self.kind == 1
        shallow[inst] = [self.layout[c][1] for c in self.cls[inst]]
        oa = self.kind == 2
        shallow[oa] = (16 + raw[oa] * REF + 7) // 8 * 8
        self.nfield = raw                                 # instance: byte length; objarray: n
        self.shallow = shallow
        self.N = len(self.ids)
        self.roots_raw = roots
        self.t_parse = time.time() - t0

    def _layout(self, cid):
        if cid in self.layout: return self.layout[cid]
        sup, fields, _ = self.classes[cid]
        size = 0
        for _, t in fields: size += REF if t == 2 else T_SIZE[t]
        if sup and sup in self.classes: total = self._layout(sup)[0] + size
        else: total = size
        self.layout[cid] = (total, align8(12 + total))
        return self.layout[cid]

    def name(self, sid): return self.strings.get(sid, '?')
    def class_name(self, cid):
        if cid < 0: return T_NAME[-cid] + '[]'
        n = self.name(self.class_name_id.get(cid, 0)).replace('/', '.')
        return n
    def obj_class_name(self, i):
        k = self.kind[i]
        if k == 0: return 'class ' + self.class_name(int(self.ids[i]))
        if k == 3: return self.class_name(int(self.cls[i]))
        return self.class_name(int(self.cls[i]))

    def idx(self, oid_array):
        a = np.asarray(oid_array, dtype=np.uint64)
        j = np.searchsorted(self.ids, a)
        j[j >= self.N] = 0
        ok = self.ids[j] == a
        return j, ok

    def refs_of(self, i, with_names=False):
        """trả về list (tên field, id đích) cho object i"""
        m = self.m; k = self.kind[i]; out = []
        if k == 1:
            cid = int(self.cls[i]); p = int(self.off[i])
            while cid and cid in self.classes:
                sup, fields, _ = self.classes[cid]
                for nid, t in fields:
                    if t == 2:
                        v = struct.unpack_from('>Q', m, p)[0]; p += 8
                        if v: out.append((nid, v))
                    else: p += T_SIZE[t]
                cid = sup
        elif k == 2:
            p = int(self.off[i]); n = int(self.nfield[i])
            for e in range(n):
                v = struct.unpack_from('>Q', m, p + 8 * e)[0]
                if v: out.append((-e - 1, v))
        elif k == 0:
            _, _, statics = self.classes[int(self.ids[i])]
            for nid, t, v in statics:
                if v: out.append((nid, v))
        return out

    def build_graph(self):
        t0 = time.time()
        src, dst = [], []
        m = self.m
        unpack = struct.unpack_from
        # bảng offset field tham chiếu theo class
        refoffs = {}
        for cid in self.classes:
            offsl = []; base = 0; c = cid
            while c and c in self.classes:
                sup, fields, _ = self.classes[c]
                for nid, t in fields:
                    if t == 2: offsl.append(base); base += 8
                    else: base += T_SIZE[t]
                c = sup
            refoffs[cid] = offsl
        kind = self.kind.tolist(); cls = self.cls.tolist(); off = self.off.tolist(); nf = self.nfield.tolist(); ids = self.ids.tolist()
        for i in range(self.N):
            k = kind[i]
            if k == 1:
                p = off[i]
                for o in refoffs.get(cls[i], ()):
                    v = unpack('>Q', m, p + o)[0]
                    if v: src.append(i); dst.append(v)
            elif k == 2:
                n = nf[i]
                if n:
                    vals = np.frombuffer(m, dtype='>u8', count=n, offset=off[i])
                    vals = vals[vals != 0]
                    src.extend([i] * len(vals)); dst.extend(vals.tolist())
            elif k == 0:
                for nid, t, v in self.classes[ids[i]][2]:
                    if v: src.append(i); dst.append(v)
        src = np.array(src, dtype=np.int64); j, ok = self.idx(dst)
        self.src = src[ok]; self.dst = j[ok].astype(np.int64)
        self.t_graph = time.time() - t0

    def dominators_chk(self):
        t0 = time.time()
        N = self.N; R = N                         # super-root
        # roots: bản ghi GC root + mọi class object
        rj, ok = self.idx(self.roots_raw)
        roots = set(rj[ok].tolist()) | set(np.nonzero(self.kind == 0)[0].tolist())
        self.roots = roots
        # CSR successors
        order = np.argsort(self.src, kind='stable')
        s_src = self.src[order]; s_dst = self.dst[order]
        start = np.searchsorted(s_src, np.arange(N + 1))
        succ_ptr = start.tolist(); succ = s_dst.tolist()
        # DFS lặp từ super-root -> postorder
        visited = bytearray(N + 1); post = []
        parent = [-1] * (N + 1)
        stack = []
        visited[R] = 1
        rootlist = sorted(roots)
        stack.append((R, 0))
        while stack:
            v, it = stack[-1]
            if v == R:
                if it < len(rootlist):
                    stack[-1] = (v, it + 1); w = rootlist[it]
                    if not visited[w]: visited[w] = 1; parent[w] = R; stack.append((w, succ_ptr[w]))
                    continue
            else:
                if it < succ_ptr[v + 1]:
                    stack[-1] = (v, it + 1); w = succ[it]
                    if not visited[w]: visited[w] = 1; parent[w] = v; stack.append((w, succ_ptr[w]))
                    continue
            stack.pop(); post.append(v)
        self.reachable = len(post) - 1
        po = [-1] * (N + 1)
        for k, v in enumerate(post): po[v] = k
        rpo = post[::-1]
        # predecessors (chỉ của node đến được)
        porder = np.argsort(self.dst, kind='stable')
        p_dst = self.dst[porder]; p_src = self.src[porder]
        pstart = np.searchsorted(p_dst, np.arange(N + 1)).tolist(); preds = p_src.tolist()
        idom = [-1] * (N + 1); idom[R] = R
        def intersect(a, b):
            while a != b:
                while po[a] < po[b]: a = idom[a]
                while po[b] < po[a]: b = idom[b]
            return a
        changed = True; it = 0
        while changed:
            changed = False; it += 1
            for v in rpo:
                if v == R: continue
                new = R if v in roots else -1
                for k in range(pstart[v], pstart[v + 1]):
                    p = preds[k]
                    if idom[p] == -1: continue
                    new = p if new == -1 else intersect(p, new)
                if new != idom[v]: idom[v] = new; changed = True
        self.idom = idom; self.iters = it
        sh = self.shallow.tolist() + [0]
        ret = [0] * (N + 1)
        for v in post:                                # con trước cha
            ret[v] += sh[v]
            if v != R: ret[idom[v]] += ret[v]
        self.retained = ret; self.post = post; self.parent_bfs = None
        self.t_dom = time.time() - t0


    def dominators(self):
        """Lengauer–Tarjan (bản 'simple', nén đường đi lặp) — một lượt, O(E log N)."""
        t0 = time.time()
        N = self.N; R = N
        rj, ok = self.idx(self.roots_raw)
        roots = set(rj[ok].tolist()) | set(np.nonzero(self.kind == 0)[0].tolist())
        self.roots = roots
        order = np.argsort(self.src, kind='stable')
        s_dst = self.dst[order]; s_src = self.src[order]
        succ_ptr = np.searchsorted(s_src, np.arange(N + 1)).tolist(); succ = s_dst.tolist()
        rootlist = sorted(roots)
        # DFS tiền thứ tự từ super-root
        dfn = [-1] * (N + 1); vertex = []; parent_n = []      # theo số dfn
        dfn[R] = 0; vertex.append(R); parent_n.append(-1)
        stack = [(R, 0)]
        while stack:
            v, it = stack[-1]
            if v == R:
                if it < len(rootlist):
                    stack[-1] = (v, it + 1); w = rootlist[it]
                    if dfn[w] < 0:
                        dfn[w] = len(vertex); vertex.append(w); parent_n.append(dfn[v]); stack.append((w, succ_ptr[w]))
                    continue
            elif it < succ_ptr[v + 1]:
                stack[-1] = (v, it + 1); w = succ[it]
                if dfn[w] < 0:
                    dfn[w] = len(vertex); vertex.append(w); parent_n.append(dfn[v]); stack.append((w, succ_ptr[w]))
                continue
            stack.pop()
        n = len(vertex); self.reachable = n - 1
        # predecessors theo dfn
        porder = np.argsort(self.dst, kind='stable')
        p_dst = self.dst[porder]; p_src = self.src[porder]
        pstart = np.searchsorted(p_dst, np.arange(N + 1)).tolist(); preds = p_src.tolist()
        semi = list(range(n)); label = list(range(n)); ancestor = [-1] * n; idom_n = [0] * n
        bucket = [[] for _ in range(n)]
        def evalv(v):
            if ancestor[v] == -1: return v
            st = []; u = v
            while ancestor[ancestor[u]] != -1: st.append(u); u = ancestor[u]
            while st:
                u = st.pop(); a = ancestor[u]
                if semi[label[a]] < semi[label[u]]: label[u] = label[a]
                ancestor[u] = ancestor[a]
            return label[v]
        for i in range(n - 1, 0, -1):
            wv = vertex[i]
            plist = [dfn[preds[k]] for k in range(pstart[wv], pstart[wv + 1]) if dfn[preds[k]] >= 0] if wv != R else []
            if wv in roots: plist.append(0)
            for v in plist:
                u = evalv(v)
                if semi[u] < semi[i]: semi[i] = semi[u]
            bucket[semi[i]].append(i)
            p = parent_n[i]; ancestor[i] = p
            for v in bucket[p]:
                u = evalv(v)
                idom_n[v] = u if semi[u] < semi[v] else p
            bucket[p] = []
        for i in range(1, n):
            if idom_n[i] != semi[i]: idom_n[i] = idom_n[idom_n[i]]
        idom = [-1] * (N + 1); idom[R] = R
        for i in range(1, n): idom[vertex[i]] = vertex[idom_n[i]]
        self.idom = idom; self.iters = 1
        sh = self.shallow.tolist() + [0]
        ret = [0] * (N + 1)
        for i in range(n - 1, 0, -1):                 # dfn giảm dần: con trước cha
            v = vertex[i]; ret[v] += sh[v]; ret[idom[v]] += ret[v]
        self.retained = ret
        self.t_dom = time.time() - t0

    def path_to_root(self, target):
        """BFS ngắn nhất từ các root tới target (theo chiều ngược: từ target lần predecessor)."""
        N = self.N
        porder = np.argsort(self.dst, kind='stable')
        p_dst = self.dst[porder]; p_src = self.src[porder]
        pstart = np.searchsorted(p_dst, np.arange(N + 1))
        prev = {target: None}; q = collections.deque([target])
        while q:
            v = q.popleft()
            if v in self.roots:
                path = [v]
                while prev[path[-1]] is not None: path.append(prev[path[-1]])
                return path                            # root ... target
            for k in range(pstart[v], pstart[v + 1]):
                p = int(p_src[k])
                if p not in prev: prev[p] = v; q.append(p)
        return None

    def field_name(self, parent, child):
        cid = int(self.ids[child])
        for nid, v in self.refs_of(parent):
            if v == cid: return f'[{-nid - 1}]' if nid < 0 else self.name(nid)
        return '?'

def mb(x): return f'{x / 1048576:,.1f} MB'

if __name__ == '__main__':
    h = Heap(sys.argv[1])
    top = 12
    print(f'# parse {h.t_parse:.1f}s  objects={h.N:,}  classes={len(h.classes):,}  shallow total={mb(int(h.shallow.sum()))}')
    print('# GC roots:', dict(h.root_kind))
    # histogram
    names = collections.Counter(); sizes = collections.Counter()
    for c, s, k, i in zip(h.cls.tolist(), h.shallow.tolist(), h.kind.tolist(), range(h.N)):
        n = h.class_name(c) if k else 'java.lang.Class'
        names[n] += 1; sizes[n] += s
    print('\n## HISTOGRAM (top theo shallow size)')
    for n, s in sizes.most_common(top): print(f'{names[n]:>10,} {mb(s):>12}  {n}')
    h.build_graph(); print(f'\n# graph {h.t_graph:.1f}s edges={len(h.src):,}')
    h.dominators(); print(f'# dominators {h.t_dom:.1f}s iterations={h.iters} reachable={h.reachable:,}')
    N = h.N; R = N
    kids = collections.defaultdict(list)
    for v in range(N):
        if h.idom[v] != -1: kids[h.idom[v]].append(v)
    print('\n## DOMINATOR TREE — con trực tiếp của gốc, theo retained size')
    tops = sorted(kids[R], key=lambda v: -h.retained[v])[:top]
    for v in tops:
        print(f'{mb(h.retained[v]):>12} retained {mb(int(h.shallow[v])):>10} shallow  {h.obj_class_name(v)} @0x{int(h.ids[v]):x}')
    # đào xuống object lớn nhất
    print('\n## ĐÀO XUỐNG nhánh lớn nhất (mỗi bước: con giữ nhiều nhất)')
    v = tops[0]
    for depth in range(8):
        print(f'{"  " * depth}{mb(h.retained[v])}  {h.obj_class_name(v)}')
        ch = sorted(kids[v], key=lambda c: -h.retained[c])
        if not ch or h.retained[ch[0]] < 0.05 * h.retained[v]:
            if ch: print(f'{"  " * (depth + 1)}... {len(ch):,} con trực tiếp, lớn nhất {mb(h.retained[ch[0]])} ({h.obj_class_name(ch[0])})')
            break
        v = ch[0]
    # retained theo class (tổng retained của các object mà cha thống trị không cùng class)
    if '--path' in sys.argv:
        cname = sys.argv[sys.argv.index('--path') + 1]
        cand = [i for i in range(N) if h.kind[i] == 1 and h.class_name(int(h.cls[i])) == cname]
        print(f'\n## PATH TO GC ROOTS cho một {cname} (có {len(cand):,} object)')
        tgt = cand[len(cand) // 2]
        path = h.path_to_root(tgt)
        for a, b in zip(path, path[1:] + [None]):
            fld = '' if b is None else ' .' + h.field_name(a, b)
            print(f'  {h.obj_class_name(a)} @0x{int(h.ids[a]):x}{fld}  (retained {mb(h.retained[a])})')
