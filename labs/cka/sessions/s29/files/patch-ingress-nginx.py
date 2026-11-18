# s29 — sửa manifest ingress-nginx đã tải (bản baremetal, Service kiểu NodePort): cổng NodePort cố định http 30080 / https 30443,
# controller chạy trên cka-cp (nodeSelector nhãn control-plane + toleration taint NoSchedule của nó). Chạy lại được (ghi đè đúng
# các trường đó). Cách dùng: python3 patch-ingress-nginx.py <tệp>. Người học sửa bằng vim cũng được: verify chấm trạng thái.
import sys, yaml
p = sys.argv[1]
docs = [d for d in yaml.safe_load_all(open(p)) if d]
seen = set()
for d in docs:
    kind, name = d.get("kind"), d["metadata"]["name"]
    if kind == "Service" and name == "ingress-nginx-controller":
        for port in d["spec"]["ports"]:
            port["nodePort"] = {"http": 30080, "https": 30443}[port["name"]]
        seen.add("svc")
    if kind == "Deployment" and name == "ingress-nginx-controller":
        spec = d["spec"]["template"]["spec"]
        spec.setdefault("nodeSelector", {})["node-role.kubernetes.io/control-plane"] = ""
        spec["tolerations"] = [{"key": "node-role.kubernetes.io/control-plane", "operator": "Exists", "effect": "NoSchedule"}]
        seen.add("deploy")
assert seen == {"svc", "deploy"}, "không thấy Service/Deployment ingress-nginx-controller trong manifest"
with open(p, "w") as f:
    yaml.safe_dump_all(docs, f, sort_keys=False, allow_unicode=True, width=1000)
