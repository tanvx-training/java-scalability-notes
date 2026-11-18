# Lỗi st5-network: "một đồng nghiệp dọn lại mạng của shop" và sửa bốn chỗ trong ~/shop/ (PyYAML, comment mất) rồi apply
# (policy tìm theo nội dung, không theo tên):
# Service catalog selector app=catalogue (không Pod nào mang: EndpointSlice rỗng); Service order targetPort 8081 (container
# nghe 8080: EndpointSlice có địa chỉ nhưng kết nối bị từ chối); NetworkPolicy của order nhận ingress controller từ namespace
# nginx-ingress (namespace thật là ingress-nginx: shop.local:30080/orders trả 504); NetworkPolicy egress DNS chọn CoreDNS bằng
# k8s-app=coredns (Pod CoreDNS mang k8s-app=kube-dns: mọi Pod của shop mất DNS). Không in ra đã làm gì (đây là đề bài sự cố).
# Chạy lại được: lần sau đặt lại đúng bốn lỗi đó, không thêm lỗi khác. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
vm "$LAB_CP" "set -e
for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
python3 - <<'PY'
import glob, os, subprocess, sys, yaml
shop = os.path.expanduser('~/shop')
# Tìm tệp chứa từng object (người học có thể đã gộp hay tách tệp); mỗi tệp sửa được ghi lại toàn bộ.
docs = {}
for p in sorted(glob.glob(f'{shop}/*.yaml') + glob.glob(f'{shop}/*.yml')):
    try:
        ds = list(yaml.safe_load_all(open(p)))
    except Exception:
        continue
    for i, d in enumerate(ds):
        if isinstance(d, dict) and d.get('kind') and (d.get('metadata') or {}).get('name'):
            docs[(d['kind'], d['metadata']['name'])] = (p, ds, i)  # tệp sau thắng, như facts.sh của s31
def sel_app(d):
    return (((d.get('spec') or {}).get('podSelector') or {}).get('matchLabels') or {}).get('app')
def peers(d, direction, key):
    return [x for r in (d.get('spec') or {}).get(direction) or [] for x in r.get(key) or []]
def is_ing_peer(x):
    return 'namespaceSelector' in x and ((x['namespaceSelector'] or {}).get('matchLabels') or {}).get('kubernetes.io/metadata.name') in ('ingress-nginx', 'nginx-ingress')
def is_dns_peer(x):
    return 'podSelector' in x and ((x['podSelector'] or {}).get('matchLabels') or {}).get('k8s-app') in ('kube-dns', 'coredns')
# Policy được tìm theo nội dung (s31 không chấm tên): policy chọn app=order có nguồn ở namespace ingress-nginx; policy có egress
# tới CoreDNS (k8s-app=kube-dns).
nps = [k for k in docs if k[0] == 'NetworkPolicy']
ord_np = [k for k in nps if sel_app(docs[k][1][docs[k][2]]) == 'order' and any(is_ing_peer(x) for x in peers(docs[k][1][docs[k][2]], 'ingress', 'from'))]
dns_np = [k for k in nps if any(is_dns_peer(x) for x in peers(docs[k][1][docs[k][2]], 'egress', 'to'))]
miss = [f'Service/{n}' for n in ('catalog', 'order') if ('Service', n) not in docs]
if not ord_np: miss.append('NetworkPolicy cho order nhận ingress-nginx')
if not dns_np: miss.append('NetworkPolicy egress DNS')
if miss:
    sys.stderr.write('lab: ~/shop/ thiếu ' + ', '.join(miss) + ' (trạng thái cuối s31); thử: ./labs/lab restore cka s31\n'); sys.exit(1)
changed = set()
def get(kind, name):
    p, ds, i = docs[(kind, name)]; changed.add(p); return ds[i]
get('Service', 'catalog')['spec']['selector'] = {'app': 'catalogue'}
for port in get('Service', 'order')['spec'].get('ports') or []:
    port['targetPort'] = 8081
for x in peers(get(*ord_np[0]), 'ingress', 'from'):
    if is_ing_peer(x): x['namespaceSelector']['matchLabels']['kubernetes.io/metadata.name'] = 'nginx-ingress'
for x in peers(get(*dns_np[0]), 'egress', 'to'):
    if is_dns_peer(x): x['podSelector']['matchLabels']['k8s-app'] = 'coredns'
for p in sorted(changed):
    _, ds, _ = next(v for v in docs.values() if v[0] == p)
    with open(p, 'w') as f:
        yaml.safe_dump_all([d for d in ds if d is not None], f, sort_keys=False, allow_unicode=True, width=1000)
    subprocess.run(['kubectl', 'apply', '-f', p], check=True, stdout=subprocess.DEVNULL)
PY
"
