# m2 — câu q16 (image không có registry trên cka-w2). Chạy trên cka-w2 (user ubuntu, sudo không hỏi mật khẩu; ctr, crictl
# của containerd 2.2, python3). Bên gửi đặt STEP:
#   STEP=prep    (setup.sh, sau khi namespace m2-q16 của lần trước đã xoá) gỡ image `m2.lab/tools:1.0` khỏi containerd (namespace
#                k8s.io) nếu lần làm trước đã nạp, rồi tạo lại bản xuất OCI `/opt/m2-images/tools.tar` (root 644) từ
#                busybox:1.37 có sẵn trên node: cùng lớp (layer), config mới (thêm Env M2_TOOLS=1.0 và nhãn) nên image có ID
#                riêng. Vì sao không chỉ gắn tên mới cho busybox: kubelet 1.37 ghi lại image nào nó đã tự kéo (theo image ID,
#                KubeletEnsureSecretPulledImages); một tên mới trỏ vào đúng ID của busybox mà kubelet từng kéo bị coi là "phải
#                kéo lại" và Pod `imagePullPolicy: Never` vẫn ErrImageNeverPull sau khi nạp (đo). Image ID mới thì kubelet coi là
#                image nạp sẵn (preloaded) như image nạp tay thật.
#                Kết quả: tệp tar có, image không có trong `crictl images` — Pod dùng nó đứng ErrImageNeverPull. Không tải gì
#                từ mạng (busybox:1.37 đã có trên mọi node từ chặng 1).
# Lỗi thì một dòng `lab: …` ra stderr và trả 1. Không in gì khi thành công.
IMG=m2.lab/tools:1.0
SRC=docker.io/library/busybox:1.37
DIR=/opt/m2-images
C() { sudo -n timeout 60 ctr -n k8s.io "$@"; }
case "$STEP" in
  prep)
    C images rm "$IMG" >/dev/null 2>&1 || true
    C images ls -q | grep -qx "$SRC" || { echo "lab: cka-w2 không có $SRC trong containerd" >&2; exit 1; }
    sudo -n install -d -m 755 $DIR
    tmp=$(mktemp -d)
    C images export --platform linux/arm64 "$tmp/src.tar" "$SRC" || { rm -rf "$tmp"; echo "lab: không xuất được $SRC" >&2; exit 1; }
    sudo -n chown "$(id -u)" "$tmp/src.tar"
    python3 - "$tmp/src.tar" "$tmp/tools.tar" "$IMG" <<'PY' || { rm -rf "$tmp"; echo "lab: không dựng được bản xuất $IMG" >&2; exit 1; }
import hashlib, io, json, sys, tarfile
src, dst, name = sys.argv[1:4]
blobs = {}
with tarfile.open(src) as t:
    for m in t.getmembers():
        if m.isfile() and m.name.startswith("blobs/sha256/"):
            blobs["sha256:" + m.name.rsplit("/", 1)[1]] = t.extractfile(m).read()
    index = json.load(t.extractfile("index.json"))
def find(desc):
    d = json.loads(blobs[desc["digest"]])
    if "manifests" in d:
        for x in d["manifests"]:
            p = x.get("platform") or {}
            if p.get("architecture") == "arm64" and p.get("os") == "linux" and x["digest"] in blobs: return find(x)
        raise SystemExit("không có manifest arm64")
    return desc, d
mdesc, man = find(index["manifests"][0])
cfg = json.loads(blobs[man["config"]["digest"]])
c = cfg.setdefault("config", {})
c["Env"] = (c.get("Env") or []) + ["M2_TOOLS=1.0"]
c["Labels"] = dict(c.get("Labels") or {}, **{"lab.m2.image": "tools-1.0"})
def put(b):
    d = "sha256:" + hashlib.sha256(b).hexdigest(); blobs[d] = b; return d
cb = json.dumps(cfg, separators=(",", ":")).encode()
man["config"] = dict(man["config"], digest=put(cb), size=len(cb))
mb = json.dumps(man, separators=(",", ":")).encode()
md = put(mb)
keep = {md, man["config"]["digest"]} | {l["digest"] for l in man["layers"]}
idx = {"schemaVersion": 2, "mediaType": "application/vnd.oci.image.index.v1+json", "manifests": [{
    "mediaType": mdesc.get("mediaType") or man.get("mediaType"), "digest": md, "size": len(mb),
    "platform": {"architecture": "arm64", "os": "linux"},
    "annotations": {"io.containerd.image.name": name, "org.opencontainers.image.ref.name": name.rsplit(":", 1)[1]}}]}
with tarfile.open(dst, "w") as t:
    def add(n, b):
        i = tarfile.TarInfo(n); i.size = len(b); i.mode = 0o644; t.addfile(i, io.BytesIO(b))
    add("oci-layout", b'{"imageLayoutVersion":"1.0.0"}')
    add("index.json", json.dumps(idx).encode())
    for d in sorted(keep): add("blobs/sha256/" + d.split(":", 1)[1], blobs[d])
PY
    sudo -n install -m 644 "$tmp/tools.tar" $DIR/tools.tar
    rm -rf "$tmp"
    if C images ls -q | grep -qx "$IMG"; then echo "lab: $IMG vẫn còn trong containerd của cka-w2" >&2; exit 1; fi
    ;;
  *) echo "lab: STEP lạ: $STEP" >&2; exit 1 ;;
esac
