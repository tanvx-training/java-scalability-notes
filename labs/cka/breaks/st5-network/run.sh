# Lỗi st5-network: "một đồng nghiệp dọn lại mạng của shop" và sửa bốn chỗ trong ~/shop/ (PyYAML, comment mất) rồi apply:
# Service catalog selector app=catalogue (không Pod nào mang: EndpointSlice rỗng); Service order targetPort 8081 (container
# nghe 8080: EndpointSlice có địa chỉ nhưng kết nối bị từ chối); NetworkPolicy order nhận ingress controller từ namespace
# nginx-ingress (namespace thật là ingress-nginx: shop.local:30080/orders trả 504); NetworkPolicy allow-dns-egress chọn CoreDNS bằng
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
            docs.setdefault((d['kind'], d['metadata']['name']), (p, ds, i))
need = [('Service', 'catalog'), ('Service', 'order'), ('NetworkPolicy', 'order'), ('NetworkPolicy', 'allow-dns-egress')]
miss = [f'{k}/{n}' for k, n in need if (k, n) not in docs]
if miss:
    sys.stderr.write('lab: ~/shop/ thiếu ' + ', '.join(miss) + ' (trạng thái cuối s31); thử: ./labs/lab restore cka s31\n'); sys.exit(1)
changed = set()
def get(kind, name):
    p, ds, i = docs[(kind, name)]; changed.add(p); return ds[i]
get('Service', 'catalog')['spec']['selector'] = {'app': 'catalogue'}
for port in get('Service', 'order')['spec'].get('ports') or []:
    port['targetPort'] = 8081
try:
    gw = get('NetworkPolicy', 'order')
    peers = [x for r in gw['spec']['ingress'] for x in r.get('from') or [] if 'namespaceSelector' in x]
    n_gw = 0
    for x in peers:
        lab = (x['namespaceSelector'].get('matchLabels') or {})
        if lab.get('kubernetes.io/metadata.name') in ('ingress-nginx', 'nginx-ingress'):
            lab['kubernetes.io/metadata.name'] = 'nginx-ingress'; n_gw += 1
    dns = get('NetworkPolicy', 'allow-dns-egress')
    n_dns = 0
    for r in dns['spec']['egress']:
        for x in r.get('to') or []:
            if 'podSelector' in x and (x['podSelector'].get('matchLabels') or {}).get('k8s-app') in ('kube-dns', 'coredns'):
                x['podSelector']['matchLabels']['k8s-app'] = 'coredns'; n_dns += 1
    assert n_gw and n_dns
except Exception:
    sys.stderr.write('lab: NetworkPolicy order / allow-dns-egress trong ~/shop/ không đúng dạng cuối s31; thử: ./labs/lab restore cka s31\n'); sys.exit(1)
for p in sorted(changed):
    _, ds, _ = next(v for v in docs.values() if v[0] == p)
    with open(p, 'w') as f:
        yaml.safe_dump_all([d for d in ds if d is not None], f, sort_keys=False, allow_unicode=True, width=1000)
    subprocess.run(['kubectl', 'apply', '-f', p], check=True, stdout=subprocess.DEVNULL)
PY
"
