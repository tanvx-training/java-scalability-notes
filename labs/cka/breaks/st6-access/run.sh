# Lỗi st6-access: "một đồng nghiệp sửa lại quyền truy cập" và làm hỏng hai chỗ (không in ra đã làm gì: đây là đề bài sự cố):
# 1. ~/dev.kubeconfig: server đổi sang cổng 10250 (kubelet của cka-cp; cert serving tự ký chỉ có DNS:cka-cp trong SAN, nên
#    kubectl báo lỗi TLS "x509: cannot validate certificate for 192.168.252.35 because it doesn't contain any IP SANs": Go
#    kiểm tên/IP trước chuỗi CA), và cert + key nhúng của user dev thay bằng của ops (~/users/ops.{crt,key}):
#    sửa được cổng rồi thì tệp xác thực là ops, không phải dev. Các trường khác của tệp giữ nguyên, quyền 600.
# 2. ClusterRoleBinding shop-ops (trong ~/shop/rbac.yaml, tìm theo nội dung): subjects thành User shop-ops thay cho Group
#    shop-ops, ghi lại tệp bằng PyYAML (comment mất) rồi apply: ops mất mọi quyền đọc.
# Cần trạng thái cuối s35; thiếu thì dừng, không gây gì. Chạy lại được: lần sau đặt lại đúng hai lỗi đó, không thêm lỗi khác.
# Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
vm "$LAB_CP" "set -e
for i in \$(seq 1 90); do kubectl --request-timeout=5s get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
python3 - <<'PY'
import base64, glob, os, subprocess, sys, yaml
home = os.path.expanduser('~')
kc = f'{home}/dev.kubeconfig'
miss = [p for p in (kc, f'{home}/users/ops.crt', f'{home}/users/ops.key') if not os.path.isfile(p)]
docs = {}
for p in sorted(glob.glob(f'{home}/shop/*.yaml') + glob.glob(f'{home}/shop/*.yml')):
    try: ds = list(yaml.safe_load_all(open(p)))
    except Exception: continue
    for i, d in enumerate(ds):
        if isinstance(d, dict) and d.get('kind') == 'ClusterRoleBinding' and (d.get('metadata') or {}).get('name') == 'shop-ops':
            docs[p] = (ds, i)
if not docs: miss.append('ClusterRoleBinding shop-ops trong ~/shop/')
try: cfg = yaml.safe_load(open(kc)) if os.path.isfile(kc) else None
except Exception: cfg = None
if os.path.isfile(kc) and not (isinstance(cfg, dict) and len(cfg.get('clusters') or []) == 1 and len(cfg.get('users') or []) == 1):
    miss.append('~/dev.kubeconfig một cluster, một user')
if miss:
    sys.stderr.write('lab: thiếu ' + ', '.join(miss) + ' (trạng thái cuối s35); thử: ./labs/lab restore cka s35\n'); sys.exit(1)
# 1. kubeconfig của dev: cổng 10250, cert/key của ops.
c = cfg['clusters'][0]['cluster']
host = c['server'].split('://', 1)[-1].rsplit(':', 1)[0]
c['server'] = f'https://{host}:10250'
u = cfg['users'][0]['user']
u['client-certificate-data'] = base64.b64encode(open(f'{home}/users/ops.crt', 'rb').read()).decode()
u['client-key-data'] = base64.b64encode(open(f'{home}/users/ops.key', 'rb').read()).decode()
tmp = kc + '.lab-tmp'
with open(tmp, 'w') as f: yaml.safe_dump(cfg, f, sort_keys=False)
os.chmod(tmp, 0o600); os.replace(tmp, kc)
# 2. ClusterRoleBinding shop-ops: User thay cho Group (subjects đổi được; roleRef thì không).
for p, (ds, i) in docs.items():
    ds[i]['subjects'] = [{'apiGroup': 'rbac.authorization.k8s.io', 'kind': 'User', 'name': 'shop-ops'}]
    with open(p, 'w') as f:
        yaml.safe_dump_all([d for d in ds if d is not None], f, sort_keys=False, allow_unicode=True, width=1000)
    subprocess.run(['kubectl', '--request-timeout=10s', 'apply', '-f', p], check=True, stdout=subprocess.DEVNULL)
PY
"
