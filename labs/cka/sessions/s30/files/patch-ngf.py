# s30 — sửa manifest NGINX Gateway Fabric đã tải (deploy/nodeport/deploy.yaml): control plane nginx-gateway chạy trên cka-cp;
# NginxProxy của GatewayClass nginx (khuôn cho data plane mà NGF tạo cho mỗi Gateway, ở namespace của Gateway): NodePort cố định
# 30280 cho listener cổng 80, Pod data plane trên cka-cp, requests/limits rõ ràng (namespace shop có ResourceQuota). Chạy lại được.
# Cách dùng: python3 patch-ngf.py <tệp>. Người học sửa bằng vim cũng được: verify chấm trạng thái.
import sys, yaml
p = sys.argv[1]
docs = [d for d in yaml.safe_load_all(open(p)) if d]
CP_SEL = {"node-role.kubernetes.io/control-plane": ""}
CP_TOL = [{"key": "node-role.kubernetes.io/control-plane", "operator": "Exists", "effect": "NoSchedule"}]
seen = set()
for d in docs:
    kind, name = d.get("kind"), d["metadata"]["name"]
    if kind == "Deployment" and name == "nginx-gateway":
        spec = d["spec"]["template"]["spec"]
        spec["nodeSelector"] = dict(CP_SEL); spec["tolerations"] = list(CP_TOL)
        seen.add("deploy")
    if kind == "Job" and name == "nginx-gateway-cert-generator":
        spec = d["spec"]["template"]["spec"]
        spec["nodeSelector"] = dict(CP_SEL); spec["tolerations"] = list(CP_TOL)
    if kind == "NginxProxy" and name == "nginx-gateway-proxy-config":
        k = d["spec"].setdefault("kubernetes", {})
        k.setdefault("service", {})["nodePorts"] = [{"port": 30280, "listenerPort": 80}]
        dep = k.setdefault("deployment", {})
        dep["pod"] = {"nodeSelector": dict(CP_SEL), "tolerations": list(CP_TOL)}
        dep.setdefault("container", {})["resources"] = {"requests": {"cpu": "50m", "memory": "64Mi"}, "limits": {"memory": "128Mi"}}
        seen.add("proxy")
assert seen == {"deploy", "proxy"}, "không thấy Deployment nginx-gateway / NginxProxy nginx-gateway-proxy-config trong manifest"
with open(p, "w") as f:
    yaml.safe_dump_all(docs, f, sort_keys=False, allow_unicode=True, width=1000)
