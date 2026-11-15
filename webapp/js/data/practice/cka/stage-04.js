// Chặng 4 — Storage: PostgreSQL bền vững.
// s22–s25 đã phát hành (đợt 3).

export const sessions = [
// ───────────────────────────── s22 ─────────────────────────────
  {
    id: "s22",
    stage: "st4",
    title: "Volume, PersistentVolume và PersistentVolumeClaim",
    durationMin: 75,
    domain: "storage",
    competencies: ["st-pv-pvc", "st-volume-types"],
    requires: ["s21"],
    status: "published",
    pieces: [],
    goals: [
      "Chọn đúng loại volume cho từng nhu cầu của shop: emptyDir cho tệp tạm, configMap cho cấu hình, PVC cho dữ liệu.",
      "Tạo PV hostPath và PVC khớp nhau theo dung lượng, access mode, storageClassName; thấy cả hai Bound.",
      "Chứng minh dữ liệu trên PVC còn sau khi xoá và tạo lại Pod.",
    ],
    skills: [
      { skill: "k-emptydir", level: "Viết được không tra" },
      { skill: "k-pv-pvc-yaml", level: "Viết được không tra" },
      { skill: "k-pod-mount-pvc", level: "Viết được không tra" },
      { skill: "k-get-pv-pvc", level: "Gõ được không tra" },
      { skill: "k-describe-pvc", level: "Gõ được không tra" },
      { skill: "k-access-modes", level: "Giải thích được" },
      { skill: "k-volume-types", level: "Giải thích được" },
    ],
    uses: ["k-exec", "k-delete-now", "k-nodename", "vim-paste-mode", "k-explain"],
    foundation: null,
    mindset: `**Volume gắn với cái gì thì sống bằng cái đó.** Mỗi loại volume trả lời ba câu: dữ liệu nằm ở đâu, sống bao lâu, ai dùng chung được.

| Loại | Dữ liệu nằm ở | Sống tới khi | Dùng khi | Ở shop |
|---|---|---|---|---|
| \`emptyDir\` | đĩa của node (\`/var/lib/kubelet/pods/<uid>/volumes/kubernetes.io~empty-dir/\`), hoặc RAM với \`medium: Memory\` | Pod bị xoá hay dời node (container restart thì **còn**) | tệp tạm, cache, chia tệp giữa các container của cùng Pod | \`/tmp\` của JVM khi rootfs chỉ đọc |
| \`configMap\`, \`secret\` | API server, kubelet chép xuống node | đối tượng còn; sửa thì tệp tự cập nhật (s12) | cấu hình, chứng chỉ | \`gateway-files\`, \`db-cred\` |
| \`hostPath\` | một thư mục của node | node còn | agent của node (log, socket containerd); lab một node | log-agent đọc \`/var/log\` (s16) |
| \`persistentVolumeClaim\` | thứ PV trỏ tới: hostPath, local, NFS, đĩa cloud… | PVC còn (và tuỳ reclaim policy của PV) | dữ liệu phải sống lâu hơn Pod | PostgreSQL ở s24 |

**PV và PVC tách hai vai.** Người quản trị (hay provisioner, s23) tạo **PersistentVolume**: một mảnh lưu trữ có thật, cluster-scoped, ghi dung lượng, access mode, \`storageClassName\`, reclaim policy. Ứng dụng tạo **PersistentVolumeClaim** trong namespace của mình: "tôi cần 1Gi, ReadWriteOnce, lớp manual". PV controller trong kube-controller-manager ghép mỗi PVC với **một** PV khớp cả ba điều kiện: cùng \`storageClassName\`, access mode của PVC nằm trong của PV, dung lượng PV ≥ yêu cầu (nhiều PV khớp thì chọn PV nhỏ nhất). Ghép rồi là một đối một: PV có \`claimRef\` trỏ ngược về PVC, cả hai \`Bound\`. Không khớp thì PVC đứng \`Pending\` mãi, không ai báo lỗi đỏ: phải đọc Events của PVC.

\`storageClassName: manual\` ở đây chỉ là một cái nhãn để ghép tay: không có đối tượng StorageClass nào tên \`manual\`, và cũng không cần. Ghép tay như vậy là *static provisioning*; s23 thay bằng provisioner tạo PV theo yêu cầu.

**Access mode là lời hứa về node, không về Pod.** \`ReadWriteOnce\` (RWO): mount đọc ghi trên **một node** (nhiều Pod cùng node vẫn dùng chung được); \`ReadOnlyMany\` (ROX): nhiều node chỉ đọc; \`ReadWriteMany\` (RWX): nhiều node đọc ghi, cần storage mạng (NFS, CephFS…); \`ReadWriteOncePod\` (RWOP): đúng một Pod trong cả cluster. hostPath và local chỉ *đúng nghĩa* RWO: khai RWX vẫn bind, nhưng không node nào khác thấy dữ liệu. PVC xin RWX mà PV chỉ có RWO thì không bao giờ bind. Access mode của PV là *khả năng* được dùng để ghép; Kubernetes không tự chặn hai Pod trên hai node ghi vào một hostPath — đó là lý do PV hostPath phải có \`nodeAffinity\`.

**hostPath "trên cka-w2" nghĩa là gì.** PV hostPath chỉ là một đường dẫn; tự nó không biết thuộc node nào. Không có \`nodeAffinity\`, Pod dùng PVC được xếp lên cka-w1 sẽ mount \`/mnt/shop-data\` *của cka-w1*: một thư mục rỗng khác, dữ liệu "mất" mà không lỗi nào. \`nodeAffinity\` của PV (\`kubernetes.io/hostname In [cka-w2]\`) làm scheduler chỉ xếp Pod dùng PV này lên cka-w2. \`type: DirectoryOrCreate\` để kubelet tự tạo thư mục nếu chưa có.

**Spring Boot và \`emptyDir\`.** JVM đọc thư mục tạm từ \`java.io.tmpdir\` (mặc định \`/tmp\`). Spring Boot dùng nó nhiều hơn bạn nghĩ: Tomcat nhúng tạo thư mục làm việc \`tomcat.<port>.<số>\` ở đó (đặt được bằng \`server.tomcat.basedir\`), và multipart upload lớn được ghi tạm ra đĩa ở đó (đổi bằng \`spring.servlet.multipart.location\`). Trong container, \`/tmp\` mặc định nằm trong lớp ghi của rootfs: mất khi container restart, và khi bạn bật \`readOnlyRootFilesystem: true\` (hardening, chặng 6) thì ứng dụng ghi không được. Cách chuẩn: mount một \`emptyDir\` vào \`/tmp\` (có \`sizeLimit\` để một Pod không lấp đầy đĩa của node, vượt thì kubelet evict Pod). \`medium: Memory\` biến nó thành tmpfs, và dung lượng tmpfs **tính vào memory limit** của container: với JVM đã sát limit (s17) là cách nhanh nhất để OOMKilled.`,
    refs: [
      { label: "Bài lộ trình CKA: Ôn PV/PVC, accessModes, reclaim policies", href: "#/roadmap/cka/cka-w5-1" },
      { label: "Bài lộ trình CKA: hostPath vs local volume", href: "#/roadmap/cka/cka-w5-5" },
      { label: "Bài lộ trình CKAD: Volumes — emptyDir, hostPath, configMap, secret", href: "#/roadmap/ckad/w7-1" },
      { label: "Bài lộ trình CKA Study Guide: Volume, PersistentVolume, PVC và StorageClass", href: "#/roadmap/ckabook/cb-w4-4" },
      { label: "CKA Study Guide, chương 15 — Volume", href: "#/docs/ckabook-15" },
      { label: "CKA Study Guide, chương 16 — Persistent Volume", href: "#/docs/ckabook-16" },
      { label: "Thực hành nhanh: k get pv,pvc, k describe pvc", href: "#/commands" },
      { label: "kubernetes.io: Volumes (emptyDir, hostPath, configMap…)", href: "https://kubernetes.io/docs/concepts/storage/volumes/" },
      { label: "kubernetes.io: Persistent Volumes (binding, access modes, reclaim)", href: "https://kubernetes.io/docs/concepts/storage/persistent-volumes/" },
      { label: "kubernetes.io: Configure a Pod to Use a PersistentVolume for Storage", href: "https://kubernetes.io/docs/tasks/configure-pod-container/configure-persistent-volume-storage/" },
    ],
    stateIn: "Đầu ra s21 (mốc `st3-done`): shop chạy đủ trong shop-quota (pods 20, requests.memory 3Gi) và LimitRange shop-limits (gán 50m/64Mi cho container không khai); cka-w2 mang nhãn role=db, không taint; metrics-server và HPA catalog (2–3). Chưa có PV, PVC hay StorageClass nào. `./labs/lab begin cka s22` kiểm đầu vào bằng verify của s21, tạo ~/drills/s22 và xoá answers.env cũ.",
    stateOut: "PV shop-data (hostPath /mnt/shop-data trên cka-w2, 1Gi, RWO, manual, Retain, nodeAffinity cka-w2) Bound với PVC shop/shop-data, cả hai trong ~/shop/shop-data.yaml; /mnt/shop-data/probe.txt trên cka-w2 có chuỗi bạn ghi; Pod scratch và pvc-probe đã xoá; ~/drills/s22/answers.env.",
    tasks: [
      { id: "t1", text: "`./labs/lab begin cka s22` trên Mac (tạo ~/drills/s22). Trên cka-cp: `~/drills/s22/scratch.yaml`: Pod `scratch` (namespace shop) hai container busybox:1.37 dùng chung một `emptyDir` (`sizeLimit: 16Mi`) mount ở `/cache`: `writer` ghi `date >> /cache/log.txt` mỗi 5 giây, `reader` mount `readOnly: true` và `tail -f` tệp đó. Apply, `k logs scratch -c reader`. Rồi `k exec scratch -c writer -- ls /cache` và `k exec scratch -c reader -- touch /cache/x`: vì sao lệnh sau lỗi? Ghi `SCRATCH_RO_ERROR=<thông báo lỗi>` (phần đứng sau `/cache/x:` trong lỗi của touch) vào `~/drills/s22/answers.env`." },
      { id: "t2", text: "Thư mục emptyDir nằm đâu? `k get pod scratch -o jsonpath='{.metadata.uid} {.spec.nodeName}'`, rồi trên node đó `ssh <node> sudo ls -l /var/lib/kubelet/pods/<uid>/volumes/kubernetes.io~empty-dir/cache`. Rồi `k delete pod scratch --now`: thư mục trên node còn không? (Container restart thì thư mục còn; xoá Pod thì mất.)" },
      { id: "t3", text: "Tình huống hỏng: `~/shop/shop-data.yaml` chỉ có PVC `shop-data` (shop, `storageClassName: manual`, `ReadWriteMany`, 2Gi). Apply. `k get pvc`, `k describe pvc shop-data`: STATUS, Events nói gì? Chưa có PV nào, nên chưa ai trả lời được." },
      { id: "t4", text: "Thêm PV `shop-data` vào đầu cùng tệp (khung `sn-pv-pvc`): hostPath `/mnt/shop-data` (`type: DirectoryOrCreate`), 1Gi, `ReadWriteOnce`, `persistentVolumeReclaimPolicy: Retain`, `storageClassName: manual`, `nodeAffinity` required `kubernetes.io/hostname In [cka-w2]`. Apply. PVC có Bound không? `k get pv shop-data` STATUS là gì, `k describe pvc shop-data` báo gì? Sửa PVC về `ReadWriteOnce`, 1Gi: thử `k apply` trước (đọc lỗi), rồi xoá PVC và apply lại. `k get pv,pvc` phải hai dòng Bound trỏ vào nhau." },
      { id: "t5", text: "`~/drills/s22/pvc-probe.yaml`: Pod `pvc-probe` (busybox:1.37, `sleep 3600`, `nodeName: cka-w2`) mount PVC `shop-data` ở `/data`. Ghi UID của chính Pod này vào volume: `uid=$(k get pod pvc-probe -o jsonpath='{.metadata.uid}')`, `k exec pvc-probe -- sh -c \"echo $uid > /data/probe.txt\"`. `k delete pod pvc-probe --now`, apply lại (Pod mới có UID khác: `k get pod pvc-probe -o jsonpath='{.metadata.uid}'`), `k exec pvc-probe -- cat /data/probe.txt`. Ghi `PVC_REUSE_CONTENT=<UID đọc được>` vào `~/drills/s22/answers.env`. Trên cka-w2: `sudo cat /mnt/shop-data/probe.txt`." },
      { id: "t6", text: "Dọn: xoá `pvc-probe` (và `scratch` nếu còn). `k get pv,pvc` vẫn Bound. Trên Mac: `./labs/lab verify cka s22` phải đạt 4/4. Verify đọc journal của kubelet trên hai worker để biết Pod scratch và hai Pod pvc-probe đã thật sự chạy và mount volume, nên các Pod đã xoá vẫn được tính." },
    ],
    hints: [
      "PVC Pending: so ba thứ với `k get pv` — STORAGECLASS trùng từng chữ, ACCESS MODES của PVC nằm trong của PV, CAPACITY ≥ yêu cầu. Thiếu một là không bind, và PV vẫn `Available`.",
      "Event `ProvisioningFailed … storageclass.storage.k8s.io \"manual\" not found` không bảo bạn tạo StorageClass `manual`: nó nói không PV nào khớp nên controller thử cấp động và không tìm được lớp. Sửa chỗ lệch giữa PV và PVC.",
      "PVC đã tạo gần như không sửa được: `spec` chỉ cho tăng `resources.requests` khi đã Bound. PVC sai đang Pending thì `k delete pvc shop-data` rồi apply lại.",
      "Thụt lề của `nodeAffinity` trong PV: `spec.nodeAffinity.required.nodeSelectorTerms[].matchExpressions[]` (giống `requiredDuringSchedulingIgnoredDuringExecution` của Pod nhưng tên ngắn hơn). Quên thì `k explain pv.spec.nodeAffinity --recursive`.",
      "`k exec pvc-probe -- sh -c \"echo $uid > /data/probe.txt\"`: phải có `sh -c` và cả lệnh trong nháy, nếu không dấu `>` được shell của cka-cp hiểu và tệp nằm trên cka-cp. Nháy kép để `$uid` được shell của cka-cp thay trước khi gửi vào Pod.",
      "Pod với `nodeName` bỏ qua scheduler (s19): không có Event FailedScheduling nào; tên node không tồn tại thì PodGC xoá Pod sau ít chục giây. Gõ đúng `cka-w2`: đó là node có dữ liệu.",
      "Pod busybox chạy `sleep` không bắt SIGTERM: `k delete pod` thường chờ đủ 30 giây grace. Với Pod nháp dùng `--now`.",
    ],
    solution: `Output là của máy soạn bài; tên Pod, UID, node và thời điểm sẽ khác. Context đã ở namespace shop (s18).

**1–2. emptyDir giữa hai container**

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: scratch
  namespace: shop
spec:
  containers:
  - name: writer
    image: busybox:1.37
    command: ["sh", "-c", "while true; do date >> /cache/log.txt; sleep 5; done"]
    volumeMounts:
    - name: cache
      mountPath: /cache
  - name: reader
    image: busybox:1.37
    command: ["sh", "-c", "until [ -f /cache/log.txt ]; do sleep 1; done; tail -f /cache/log.txt"]
    volumeMounts:
    - name: cache
      mountPath: /cache
      readOnly: true
  volumes:
  - name: cache
    emptyDir:
      sizeLimit: 16Mi
\`\`\`

\`\`\`bash
k apply -f ~/drills/s22/scratch.yaml
k logs scratch -c reader
# Sun Nov 15 16:23:16 UTC 2026
# Sun Nov 15 16:23:21 UTC 2026
# Sun Nov 15 16:23:26 UTC 2026
k exec scratch -c writer -- ls -l /cache
# -rw-r--r--    1 root     root            87 Nov 15 16:23 log.txt
k exec scratch -c reader -- touch /cache/x
# touch: /cache/x: Read-only file system
# command terminated with exit code 1
echo 'SCRATCH_RO_ERROR=Read-only file system' >> ~/drills/s22/answers.env
k get pod scratch -o jsonpath='{.metadata.uid} {.spec.nodeName}'; echo
# 6c2980c8-f874-4b78-b362-288c5b8ddf76 cka-w1
ssh cka-w1 sudo ls -l /var/lib/kubelet/pods/6c2980c8-f874-4b78-b362-288c5b8ddf76/volumes/kubernetes.io~empty-dir/cache
# -rw-r--r-- 1 root root 145 Nov 15 23:23 log.txt
k delete pod scratch --now
ssh cka-w1 sudo ls /var/lib/kubelet/pods/6c2980c8-f874-4b78-b362-288c5b8ddf76
# ls: cannot access '/var/lib/kubelet/pods/6c2980c8-…': No such file or directory
\`\`\`

\`readOnly: true\` là của từng *mount*, không của volume: writer ghi được, reader chỉ đọc. Hai container thấy cùng một thư mục trên đĩa của node; kubelet xoá nó khi Pod bị xoá. Pod không khai tài nguyên nhận 50m/64Mi/128Mi của LimitRange \`shop-limits\`, nên vẫn vừa quota.

**3. PVC sai, chưa có PV**

\`\`\`bash
k apply -f ~/shop/shop-data.yaml      # lúc này chỉ có PVC: ReadWriteMany, 2Gi
k get pvc
# NAME        STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
# shop-data   Pending                                      manual         <unset>                 6s
k describe pvc shop-data | sed -n '/^Events/,$p'
#   Warning  ProvisioningFailed  1s (x2 over 6s)  persistentvolume-controller  storageclass.storage.k8s.io "manual" not found
\`\`\`

Câu thông báo dễ đánh lừa: không PV nào khớp, nên PV controller thử *cấp động* theo lớp \`manual\`, và không có StorageClass nào tên đó. Với ghép tay, đọc nó là "chưa có PV nào khớp".

**4. PV shop-data và sửa PVC**

\`\`\`yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: shop-data
spec:
  capacity:
    storage: 1Gi
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: manual
  hostPath:
    path: /mnt/shop-data
    type: DirectoryOrCreate
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - cka-w2
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: shop-data
  namespace: shop
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: manual
  resources:
    requests:
      storage: 1Gi
\`\`\`

Thêm PV mà PVC vẫn RWX/2Gi:

\`\`\`bash
k get pv,pvc
# persistentvolume/shop-data   1Gi   RWO   Retain   Available           manual   …
# persistentvolumeclaim/shop-data   Pending                              manual   …
k describe pvc shop-data | tail -1
#   Warning  ProvisioningFailed  6s (x3 over 26s)  persistentvolume-controller  storageclass.storage.k8s.io "manual" not found
\`\`\`

PV \`Available\`, PVC vẫn Pending: RWX không có trong \`[ReadWriteOnce]\`, 2Gi > 1Gi. Sửa PVC trong tệp rồi apply:

\`\`\`bash
k apply -f ~/shop/shop-data.yaml
# persistentvolume/shop-data unchanged
# The PersistentVolumeClaim "shop-data" is invalid: spec: Forbidden: spec is immutable after creation except resources.requests and volumeAttributesClassName for bound claims
k delete pvc shop-data
k apply -f ~/shop/shop-data.yaml
k get pv,pvc
# persistentvolume/shop-data   1Gi   RWO   Retain   Bound   shop/shop-data   manual   <unset>   32s
# persistentvolumeclaim/shop-data   Bound   shop-data   1Gi   RWO   manual   <unset>   5s
\`\`\`

**5. Dữ liệu sống qua lần tạo lại Pod**

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: pvc-probe
  namespace: shop
spec:
  nodeName: cka-w2
  containers:
  - name: probe
    image: busybox:1.37
    command: ["sleep", "3600"]
    volumeMounts:
    - name: data
      mountPath: /data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: shop-data
\`\`\`

\`\`\`bash
k apply -f ~/drills/s22/pvc-probe.yaml
uid=$(k get pod pvc-probe -o jsonpath='{.metadata.uid}'); echo $uid
# 94ce822d-1f60-4781-8e3b-621203bc8903
k exec pvc-probe -- sh -c "echo $uid > /data/probe.txt"
k delete pod pvc-probe --now
k apply -f ~/drills/s22/pvc-probe.yaml
k get pod pvc-probe -o jsonpath='{.metadata.uid}'; echo
# f9b5c4c3-c986-4166-817c-7f34308bf467
k exec pvc-probe -- cat /data/probe.txt
# 94ce822d-1f60-4781-8e3b-621203bc8903
echo PVC_REUSE_CONTENT=94ce822d-1f60-4781-8e3b-621203bc8903 >> ~/drills/s22/answers.env
ssh cka-w2 'ls -ld /mnt/shop-data; sudo cat /mnt/shop-data/probe.txt'
# drwxr-xr-x 2 root root 4096 Nov 15 23:25 /mnt/shop-data
# 94ce822d-1f60-4781-8e3b-621203bc8903
\`\`\`

Pod mới (UID khác) đọc được thứ Pod cũ đã ghi: dữ liệu nằm ở PV, không ở Pod. Pod đã xoá vẫn để lại dấu trong journal của kubelet trên cka-w2, và verify dựa vào đó để biết hai Pod đã thật sự mount \`shop-data\`:

\`\`\`bash
ssh cka-w2 "sudo journalctl -u kubelet -o cat | grep 'pod=\\"shop/pvc-probe\\"' | grep -o 'VerifyControllerAttachedVolume started for volume [^(]*' | sort | uniq -c"
#       1 VerifyControllerAttachedVolume started for volume \\"kube-api-access-clcx8\\"
#       1 VerifyControllerAttachedVolume started for volume \\"kube-api-access-crmmp\\"
#       2 VerifyControllerAttachedVolume started for volume \\"shop-data\\"
\`\`\`

kubelet tạo \`/mnt/shop-data\` (\`DirectoryOrCreate\`, root, 0755) lần đầu có Pod mount. Container busybox chạy bằng root nên ghi được; image shop chạy UID 10001 (s10) sẽ cần thư mục cho UID đó ghi (hostPath không áp \`fsGroup\`).

**6. Dọn**

\`\`\`bash
k delete pod pvc-probe --now
k get pv,pvc        # vẫn Bound: xoá Pod không đụng tới PVC
\`\`\`

Lời giải tự động: \`labs/cka/sessions/s22/apply.sh\` (chạy bài emptyDir, apply \`~/shop/shop-data.yaml\`, ghi, tạo lại Pod, đọc lại, ghi đáp án; không làm bước PVC sai).`,
    exam: {
      patterns: [
        "\"Tạo PV tên X, 1Gi, hostPath /data, accessMode RWX/RWO\" — chép khung từ kubernetes.io (Configure a Pod to Use a PersistentVolume), sửa đúng từng trường đề cho.",
        "\"Tạo PVC Y dùng PV X, rồi Pod mount ở /var/www\" — `storageClassName` hai bên phải trùng (đề hay cho sẵn tên lớp); kiểm `k get pv,pvc` Bound trước khi viết Pod.",
        "\"PVC đang Pending, sửa\" — `k describe pvc`, so access mode, dung lượng, `storageClassName` với `k get pv`; PVC không sửa được thì xoá và tạo lại.",
        "\"Hai container trong một Pod dùng chung thư mục\" — `emptyDir` khai một lần ở `volumes`, mount ở cả hai container.",
      ],
      timeTargetMin: 8,
      drills: [
        {
          text: "Trong 4 phút: PV `pv-log` (500Mi, ReadWriteMany, hostPath `/pv/log`, storageClassName `log`) và PVC `pvc-log` (namespace default, 400Mi, RWX) bind vào nó.",
          timeLimitMin: 4,
          solution: "```yaml\napiVersion: v1\nkind: PersistentVolume\nmetadata:\n  name: pv-log\nspec:\n  capacity:\n    storage: 500Mi\n  accessModes: [ReadWriteMany]\n  storageClassName: log\n  hostPath:\n    path: /pv/log\n---\napiVersion: v1\nkind: PersistentVolumeClaim\nmetadata:\n  name: pvc-log\nspec:\n  accessModes: [ReadWriteMany]\n  storageClassName: log\n  resources:\n    requests:\n      storage: 400Mi\n```\n`k get pv,pvc`: PVC Bound với CAPACITY 500Mi (dung lượng của PV, không phải 400Mi).",
        },
        {
          text: "Trong 3 phút: Pod `sidecar` hai container busybox, `app` ghi `date` vào `/out/a.log` mỗi giây, `tail` đọc tệp đó qua một emptyDir.",
          timeLimitMin: 3,
          solution: "```yaml\napiVersion: v1\nkind: Pod\nmetadata:\n  name: sidecar\nspec:\n  volumes:\n  - name: out\n    emptyDir: {}\n  containers:\n  - name: app\n    image: busybox:1.37\n    command: [sh, -c, 'while true; do date >> /out/a.log; sleep 1; done']\n    volumeMounts: [{name: out, mountPath: /out}]\n  - name: tail\n    image: busybox:1.37\n    command: [sh, -c, 'tail -F /out/a.log']\n    volumeMounts: [{name: out, mountPath: /out}]\n```\n`k logs sidecar -c tail`.",
        },
      ],
    },
    tips: [
      "Trong phòng thi gõ `persistent volume` vào ô tìm của kubernetes.io: trang *Configure a Pod to Use a PersistentVolume for Storage* có sẵn PV hostPath, PVC và Pod.",
      "`k get pv` có cột CLAIM: PVC nào đang giữ PV. `k get pvc` có cột VOLUME: PVC đã bind vào PV nào. Hai cột phải trỏ vào nhau.",
      "PVC gần như không sửa được sau khi tạo (chỉ tăng dung lượng khi đã Bound và StorageClass cho phép): sai thì `k delete pvc` rồi tạo lại.",
      "`k explain pv.spec --recursive | less` khi quên tên trường (`persistentVolumeReclaimPolicy`, `nodeAffinity.required.nodeSelectorTerms`).",
    ],
    outcome: {
      md: `shop có chỗ cho dữ liệu sống lâu hơn Pod. Trên Mac:

\`\`\`bash
./labs/lab verify cka s22
\`\`\`

Verify kiểm PV và PVC (dung lượng, access mode, lớp, reclaim policy, \`nodeAffinity\`, Bound hai chiều), đọc thẳng \`probe.txt\` trên đĩa của cka-w2 theo đường dẫn trong PV, đọc journal của kubelet trên hai worker để biết Pod scratch có emptyDir và hai Pod pvc-probe (UID khác nhau) đã thật sự chạy và mount volume, so với đáp án của bạn, và kiểm hai Pod nháp đã xoá. Journal nằm trên đĩa của VM nên vẫn đọc được sau khi VM khởi động lại.`,
      verifyOutput: "lab: kiểm s22\n  (chờ apiserver, nếu đang khởi động: tối đa ~3 phút)\n  ✓ PV shop-data: hostPath, 1Gi, ReadWriteOnce, storageClassName manual, Retain, nodeAffinity ghim cka-w2\n  ✓ PVC shop/shop-data: 1Gi, ReadWriteOnce, storageClassName manual; Bound với PV shop-data\n  ✓ probe.txt trên cka-w2 = UID Pod pvc-probe đã ghi; Pod pvc-probe tạo lại (UID khác) mount lại shop-data; PVC_REUSE_CONTENT khớp\n  ✓ Pod scratch (emptyDir) đã chạy, SCRATCH_RO_ERROR là lỗi ghi vào mount readOnly; Pod nháp scratch, pvc-probe (shop) đã xoá\n  → 4/4 đạt",
      projectDelta: "shop có PV shop-data và PVC shop-data (ghép tay, hostPath trên cka-w2). Buổi sau thay việc ghép tay bằng StorageClass và provisioner động, thứ PostgreSQL ở s24 sẽ dùng.",
    },
    review: [
      { q: "Pod có hai container dùng chung một emptyDir. Container writer bị restart. Dữ liệu còn không? Xoá Pod thì sao?", a: "Container restart: còn (emptyDir gắn với Pod, không với container). Xoá Pod hoặc Pod bị dời sang node khác: mất, kubelet xoá thư mục `/var/lib/kubelet/pods/<uid>/volumes/kubernetes.io~empty-dir/…`." },
      { q: "PVC xin `ReadWriteMany`, 2Gi; PV có `ReadWriteOnce`, 1Gi, cùng storageClassName. Vì sao Pending, và PV ở trạng thái nào?", a: "PV controller cần cả ba điều kiện khớp: access mode của PVC nằm trong của PV (RWX không có trong [RWO]) và capacity ≥ request (1Gi < 2Gi). Không PV nào khớp nên PVC Pending, PV vẫn `Available`." },
      { q: "PV hostPath không có nodeAffinity. Pod dùng PVC của nó được xếp lên node khác node chứa dữ liệu. Điều gì xảy ra?", a: "Không lỗi gì: kubelet của node mới mount (hay tạo, với DirectoryOrCreate) thư mục cùng đường dẫn trên node đó, một thư mục rỗng. Dữ liệu \"mất\" lặng lẽ. nodeAffinity của PV làm scheduler chỉ xếp Pod lên đúng node." },
      { q: "`ReadWriteOnce` có nghĩa là chỉ một Pod được mount?", a: "Không: một **node**. Nhiều Pod trên cùng node vẫn mount RWO đọc ghi được. Đúng một Pod trong cả cluster là `ReadWriteOncePod`." },
      { q: "Spring Boot chạy với `readOnlyRootFilesystem: true` báo lỗi không tạo được thư mục tạm của Tomcat. Sửa thế nào?", a: "Mount một `emptyDir` (có `sizeLimit`) vào `/tmp`, nơi `java.io.tmpdir` trỏ tới: Tomcat nhúng tạo thư mục làm việc và lưu multipart upload ở đó. Đừng dùng `medium: Memory` nếu JVM đã sát memory limit: tmpfs tính vào limit." },
    ],
  },

// ───────────────────────────── s23 ─────────────────────────────
  {
    id: "s23",
    stage: "st4",
    title: "StorageClass, dynamic provisioning, access mode, reclaim policy",
    durationMin: 75,
    domain: "storage",
    competencies: ["st-sc-dynamic", "st-volume-types"],
    requires: ["s22"],
    status: "published",
    pieces: [],
    goals: [
      "Cài local-path-provisioner từ manifest ghim phiên bản lên cka-cp, đặt nó làm StorageClass mặc định và thấy PVC tự sinh PV.",
      "Giải thích WaitForFirstConsumer bằng chính PVC đứng Pending cho tới khi có Pod.",
      "Đổi reclaim policy của PV sang Retain và chỉ ra điều gì xảy ra khi xoá PVC.",
    ],
    skills: [
      { skill: "k-storageclass-yaml", level: "Viết được có tra" },
      { skill: "k-get-sc", level: "Gõ được không tra" },
      { skill: "k-local-path-provisioner", level: "Làm được có tra" },
      { skill: "k-default-sc", level: "Gõ được có tra" },
      { skill: "k-reclaim-policy", level: "Gõ được có tra" },
      { skill: "k-pv-sort", level: "Gõ được không tra" },
      { skill: "k-binding-mode", level: "Giải thích được" },
    ],
    uses: ["k-get-pv-pvc", "k-describe-pvc", "k-access-modes", "k-events-sorted", "k-nodeselector-toleration", "k-delete-now", "vim-paste-mode"],
    foundation: null,
    mindset: `**Từ PVC tới PV, không cần người quản trị.** Ở s22 bạn tạo PV trước rồi PVC đi tìm nó. Với dynamic provisioning thì ngược lại:

1. Ứng dụng tạo PVC ghi \`storageClassName: local-path\` (hoặc bỏ trống: admission \`DefaultStorageClass\` điền tên lớp mặc định vào lúc tạo).
2. StorageClass \`local-path\` nói ai lo việc này (\`provisioner: rancher.io/local-path\`), PV sinh ra sẽ có reclaim policy gì (\`reclaimPolicy: Delete\`) và **khi nào** được tạo (\`volumeBindingMode\`).
3. Provisioner (một controller chạy như Deployment, ở đây trong \`local-path-storage\`) watch PVC của lớp mình; tới lúc phải tạo thì nó dựng thư mục trên node (bằng một *helper Pod* chạy \`mkdir\` trên đúng node đó) và tạo đối tượng PV: hostPath \`/opt/local-path-provisioner/pvc-<uid>_<namespace>_<pvc>\`, \`nodeAffinity\` ghim vào node đó, \`claimRef\` trỏ về PVC.
4. PV controller ghép PV với PVC: cả hai \`Bound\`, Pod khởi động được.

Với CSI driver của cloud thì bước 3 là gọi API cloud để tạo đĩa; luồng còn lại y như vậy. Đề thi CKA dùng chính local-path-provisioner này.

**Vì sao storage cục bộ cần \`WaitForFirstConsumer\`.** Với \`Immediate\`, provisioner tạo PV ngay khi có PVC: nó phải *đoán* node. Nếu đoán cka-w1 mà Pod dùng PVC lại đòi cka-w2 (nodeSelector \`role=db\`, thiếu RAM trên cka-w1, taint…), Pod Pending mãi với \`volume node affinity conflict\`: dữ liệu cục bộ không đi theo Pod. \`WaitForFirstConsumer\` hoãn việc đó: PVC đứng \`Pending\` với Event \`WaitForFirstConsumer\` (\`waiting for first consumer to be created before binding\`) cho tới khi có Pod dùng nó; scheduler chọn node cho Pod **xét cả mọi ràng buộc khác**, ghi node đã chọn vào annotation \`volume.kubernetes.io/selected-node\` của PVC, rồi provisioner tạo PV đúng trên node đó. PVC Pending trong lúc chưa có Pod là **bình thường**, không phải lỗi. Với đĩa cloud theo zone, lý do cũng vậy: đĩa ở zone A không gắn được vào node ở zone B.

**StorageClass mặc định là một annotation.** \`storageclass.kubernetes.io/is-default-class: "true"\` trên đúng một StorageClass. PVC không ghi \`storageClassName\` sẽ nhận lớp đó (kể cả PVC tạo *trước* khi có lớp mặc định: từ 1.28 controller gán bù). Có hai lớp mặc định thì Kubernetes dùng lớp tạo sau cùng, nhưng đó là cấu hình lỗi; \`k get sc\` hiện chữ \`(default)\` cạnh tên. Muốn PVC *không* dùng lớp nào (ghép tay như s22) thì ghi rõ \`storageClassName: ""\` hoặc một tên riêng như \`manual\`; bỏ trống là nhận lớp mặc định.

**Reclaim policy quyết định số phận dữ liệu khi PVC bị xoá.** \`Delete\`: PV và dữ liệu bị xoá theo (provisioner chạy helper Pod \`rm -rf\` thư mục). \`Retain\`: PV ở lại với phase \`Released\`, dữ liệu còn nguyên trên node, nhưng PV vẫn giữ \`claimRef\` cũ nên **không PVC mới nào bind được vào nó** cho tới khi người quản trị dọn (xoá PV, hoặc gỡ \`claimRef\` để dùng lại: s25). PV động lấy reclaim policy từ StorageClass lúc tạo; đổi StorageClass sau đó không đổi PV cũ, nên dữ liệu quan trọng thì \`k patch pv\` sang \`Retain\` ngay. PV \`shop-data\` tạo tay ở s22 đã là \`Retain\` (mặc định của PV tạo tay).

**local-path không giới hạn dung lượng.** \`storage: 128Mi\` trong PVC chỉ dùng để ghép và ghi vào PV; thư mục trên node lớn tới đâu tuỳ đĩa của node. Cũng không có RWX: chỉ \`ReadWriteOnce\` (và \`ReadWriteOncePod\`).

**Chỗ đặt provisioner.** Manifest gốc không có nodeSelector hay toleration, nên Pod provisioner rơi vào một worker 2 GB. Lab thêm \`nodeSelector: node-role.kubernetes.io/control-plane: ""\` và toleration cho taint control plane để nó chạy trên cka-cp, dành RAM worker cho JVM. Helper Pod vẫn chạy trên node chứa volume (provisioner gán thẳng \`nodeName\`), và image của nó trong ConfigMap \`local-path-config\` mặc định là \`busybox\` không tag (tức \`latest\`): lab ghim \`busybox:1.37\`, image đã có sẵn trên các node.`,
    refs: [
      { label: "Bài lộ trình CKA: StorageClass & dynamic provisioning; WaitForFirstConsumer", href: "#/roadmap/cka/cka-w5-2" },
      { label: "Bài lộ trình CKA: Default StorageClass (annotation)", href: "#/roadmap/cka/cka-w5-3" },
      { label: "Bài lộ trình CKA: Trạng thái PV — Available / Bound / Released", href: "#/roadmap/cka/cka-w5-6" },
      { label: "CKA Study Guide, chương 16 — Persistent Volume", href: "#/docs/ckabook-16" },
      { label: "Thực hành nhanh: k get storageclass, k get pv --sort-by", href: "#/commands" },
      { label: "kubernetes.io: Storage Classes (volumeBindingMode, reclaimPolicy, default)", href: "https://kubernetes.io/docs/concepts/storage/storage-classes/" },
      { label: "kubernetes.io: Dynamic Volume Provisioning", href: "https://kubernetes.io/docs/concepts/storage/dynamic-provisioning/" },
      { label: "kubernetes.io: Change the default StorageClass", href: "https://kubernetes.io/docs/tasks/administer-cluster/change-default-storage-class/" },
      { label: "kubernetes.io: Change the Reclaim Policy of a PersistentVolume", href: "https://kubernetes.io/docs/tasks/administer-cluster/change-pv-reclaim-policy/" },
      { label: "rancher/local-path-provisioner v0.0.37: README và manifest", href: "https://github.com/rancher/local-path-provisioner/tree/v0.0.37" },
    ],
    stateIn: "Đầu ra s22: PV shop-data (hostPath trên cka-w2, manual, Retain) Bound với PVC shop/shop-data; chưa có StorageClass nào (`k get sc`: No resources found). `./labs/lab begin cka s23` kiểm đầu vào bằng verify của s22, tạo ~/drills/s23 và xoá answers.env cũ. Cần Internet trên cka-cp để tải manifest và image.",
    stateOut: "local-path-provisioner v0.0.37 chạy trong local-path-storage trên cka-cp (helper Pod dùng busybox:1.37); StorageClass local-path (rancher.io/local-path, WaitForFirstConsumer, Delete) là mặc định duy nhất; không còn PVC/PV nháp; PV shop-data vẫn Retain, Bound; ~/drills/s23/answers.env.",
    tasks: [
      { id: "t1", text: "`./labs/lab begin cka s23`. Trên cka-cp: `k get sc` (chưa có gì). Tải manifest ghim phiên bản: `curl -L -o ~/drills/s23/local-path-storage-v0.0.37.yaml https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.37/deploy/local-path-storage.yaml`. Đọc tệp: có những đối tượng nào (`grep '^kind' …`)? StorageClass trong đó có `volumeBindingMode` gì, `reclaimPolicy` gì, có annotation mặc định không?" },
      { id: "t2", text: "Sửa tệp trước khi apply: Deployment `local-path-provisioner` thêm `nodeSelector: node-role.kubernetes.io/control-plane: \"\"` và toleration `node-role.kubernetes.io/control-plane` (`operator: Exists`, `effect: NoSchedule`); trong ConfigMap `local-path-config`, khoá `helperPod.yaml`, đổi `image: docker.io/library/busybox` thành `docker.io/library/busybox:1.37`. Apply, `k -n local-path-storage rollout status deploy/local-path-provisioner`, `k -n local-path-storage get pod -o wide`: Pod phải ở cka-cp. Đo `free -m` trên cka-cp trước và sau." },
      { id: "t3", text: "Đặt local-path làm StorageClass mặc định: `k patch storageclass local-path -p '{\"metadata\":{\"annotations\":{\"storageclass.kubernetes.io/is-default-class\":\"true\"}}}'`. `k get sc`: cột nào đổi? Rồi tự viết `~/drills/s23/slow-sc.yaml`: StorageClass `slow` (`rancher.io/local-path`, `WaitForFirstConsumer`, `reclaimPolicy: Retain`, **không** mặc định; khung từ trang Storage Classes). Apply, `k get sc` (chỉ `local-path` có `(default)`), rồi `k delete -f ~/drills/s23/slow-sc.yaml`." },
      { id: "t4", text: "`~/drills/s23/wffc-lab.yaml`: PVC `wffc-lab` (shop, RWO, 128Mi, **không** ghi `storageClassName`). Apply. `k get pvc wffc-lab -o jsonpath='{.spec.storageClassName}'` (ai điền?), `k get pvc wffc-lab`, `k describe pvc wffc-lab`. Đợi một phút: vẫn Pending? Ghi `WFFC_REASON=<reason của Event trên PVC>` vào `~/drills/s23/answers.env`." },
      { id: "t5", text: "`~/drills/s23/wffc-pod.yaml`: Pod `wffc-pod` (busybox:1.37, ghi `/data/hello.txt` rồi `sleep 3600`) mount PVC `wffc-lab` ở `/data`. Apply và theo dõi `k get pvc,pv` cùng `k -n local-path-storage get pod -w` (helper Pod). PVC có annotation gì mới (`k get pvc wffc-lab -o yaml | grep selected-node`)? PV sinh ra: hostPath nào, `nodeAffinity` gì, `RECLAIM POLICY` gì? Trên node đó: `sudo ls /opt/local-path-provisioner/`." },
      { id: "t6", text: "`k delete pod wffc-pod --now`, rồi `k delete pvc wffc-lab`. `k get pv`: PV còn không? Thư mục trên node còn không? Ghi `DELETED_PV=<tên PV của vòng này>` vào `~/drills/s23/answers.env`." },
      { id: "t7", text: "Làm lại t4–t5 (apply lại hai tệp). Lần này **trước khi xoá PVC**: `k patch pv <pv> -p '{\"spec\":{\"persistentVolumeReclaimPolicy\":\"Retain\"}}'`. Xoá Pod rồi PVC. `k get pv --sort-by=.spec.capacity.storage`: PV nháp ở phase nào, `CLAIM` còn ghi gì? Ghi `RETAINED_PV=<tên PV>` và `RETAINED_PHASE=<phase của nó lúc này>`. Dọn: xoá PV Released, xoá thư mục của nó trên node. `k get pv,pvc` chỉ còn shop-data. Trên Mac: `./labs/lab verify cka s23` phải đạt 4/4 (hai PV đã xoá được nhận ra qua journal kubelet: Pod wffc-pod đã mount chúng)." },
    ],
    hints: [
      "Tải manifest không được: cka-cp cần Internet (`curl -sI https://raw.githubusercontent.com`). Đường dẫn có `v0.0.37` trong URL: đó là cách ghim phiên bản, đừng dùng nhánh `master`.",
      "nodeSelector và tolerations nằm ở `spec.template.spec` của Deployment, ngang hàng `containers`. Sai chỗ thì `apply` báo `strict decoding error: unknown field \"…\"` (đo trên lab: đặt `nodeSelector` trong `containers[0]`).",
      "Pod provisioner Pending sau khi sửa: thiếu toleration (`had untolerated taint(s)` trong FailedScheduling) hoặc nhãn sai. `k get node cka-cp --show-labels | tr , '\\n' | grep control-plane`.",
      "PVC không ghi `storageClassName` và Pending không có Event `WaitForFirstConsumer`: chưa có lớp mặc định lúc tạo PVC. Từ 1.28 PVC đó được gán lớp mặc định khi bạn đặt annotation, không cần tạo lại.",
      "PVC xoá mãi không xong (`Terminating`): còn Pod đang dùng nó (finalizer `kubernetes.io/pvc-protection`). Xoá Pod trước.",
      "Patch reclaim policy **trước** khi xoá PVC. Xoá PVC rồi mới patch thì PV `Delete` đã bị provisioner xoá mất.",
    ],
    solution: `Output là của máy soạn bài; tên PV (theo UID của PVC), node và thời gian sẽ khác. Context đã ở namespace shop.

**1. Manifest ghim phiên bản**

\`\`\`bash
k get sc
# No resources found
curl -L -o ~/drills/s23/local-path-storage-v0.0.37.yaml \\
  https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.37/deploy/local-path-storage.yaml
grep '^kind' ~/drills/s23/local-path-storage-v0.0.37.yaml | sort | uniq -c
#   1 kind: ClusterRole
#   1 kind: ClusterRoleBinding
#   1 kind: ConfigMap
#   1 kind: Deployment
#   1 kind: Namespace
#   1 kind: Role
#   1 kind: RoleBinding
#   1 kind: ServiceAccount
#   1 kind: StorageClass
\`\`\`

StorageClass trong tệp: \`provisioner: rancher.io/local-path\`, \`volumeBindingMode: WaitForFirstConsumer\`, \`reclaimPolicy: Delete\`, không có annotation mặc định. Image provisioner đã ghim \`docker.io/rancher/local-path-provisioner:v0.0.37\`; image helper Pod thì không.

**2. Đặt provisioner lên cka-cp, ghim image helper**

\`\`\`bash
vim ~/drills/s23/local-path-storage-v0.0.37.yaml
\`\`\`

\`\`\`yaml
# Deployment local-path-provisioner, trong spec.template.spec (ngang hàng containers):
      nodeSelector:
        node-role.kubernetes.io/control-plane: ""
      tolerations:
      - key: node-role.kubernetes.io/control-plane
        operator: Exists
        effect: NoSchedule
# ConfigMap local-path-config, khoá helperPod.yaml:
      containers:
      - name: helper-pod
        image: docker.io/library/busybox:1.37
        imagePullPolicy: IfNotPresent
\`\`\`

\`\`\`bash
k apply -f ~/drills/s23/local-path-storage-v0.0.37.yaml
k -n local-path-storage rollout status deploy/local-path-provisioner
k -n local-path-storage get pod -o wide
# local-path-provisioner-6bbd7f54bf-b4n64   1/1   Running   0   2m50s   10.244.160.17   cka-cp   <none>   <none>
k -n local-path-storage top pod
# local-path-provisioner-6bbd7f54bf-b4n64   15m   9Mi
free -m      # trên cka-cp: trước dùng 991 MB, còn 1964 MB available; sau dùng 1014 MB, còn 1942 MB
\`\`\`

**3. Lớp mặc định**

\`\`\`bash
k patch storageclass local-path -p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
k get sc
# NAME                   PROVISIONER             RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGE
# local-path (default)   rancher.io/local-path   Delete          WaitForFirstConsumer   false                  2m52s
\`\`\`

StorageClass tự viết, không mặc định (\`~/drills/s23/slow-sc.yaml\`):

\`\`\`yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: slow
provisioner: rancher.io/local-path
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Retain
\`\`\`

\`\`\`bash
k apply -f ~/drills/s23/slow-sc.yaml
k get sc
# NAME                   PROVISIONER             RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGE
# local-path (default)   rancher.io/local-path   Delete          WaitForFirstConsumer   false                  28s
# slow                   rancher.io/local-path   Retain          WaitForFirstConsumer   false                  0s
k delete -f ~/drills/s23/slow-sc.yaml
\`\`\`

Không có annotation thì không mặc định. Xoá \`slow\` để cụm chỉ còn một lớp như cuối buổi cần (PV đã sinh từ một lớp không bị xoá theo lớp).

**4. PVC chờ consumer**

\`\`\`yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: wffc-lab
  namespace: shop
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 128Mi
\`\`\`

\`\`\`bash
k apply -f ~/drills/s23/wffc-lab.yaml
k get pvc wffc-lab -o jsonpath='{.spec.storageClassName}'; echo
# local-path
k get pvc wffc-lab
# wffc-lab   Pending                                      local-path     <unset>                 3s
k describe pvc wffc-lab | sed -n '/^Events/,$p'
#   Normal  WaitForFirstConsumer  3s    persistentvolume-controller  waiting for first consumer to be created before binding
echo WFFC_REASON=WaitForFirstConsumer >> ~/drills/s23/answers.env
\`\`\`

Bạn không ghi lớp; admission \`DefaultStorageClass\` điền \`local-path\` lúc tạo. Event là \`Normal\`, không phải \`Warning\`: đây là trạng thái chờ, không phải lỗi.

**5. Có Pod thì có PV**

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: wffc-pod
  namespace: shop
spec:
  containers:
  - name: app
    image: busybox:1.37
    command: ["sh", "-c", "echo hello > /data/hello.txt; sleep 3600"]
    volumeMounts:
    - name: data
      mountPath: /data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: wffc-lab
\`\`\`

\`\`\`bash
k apply -f ~/drills/s23/wffc-pod.yaml
k -n local-path-storage get pod -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName,IMAGE:.spec.containers[0].image
# helper-pod-create-pvc-87273f83-ce6c-4ed3-8ecd-9da9d6cdbd27   cka-w1   docker.io/library/busybox:1.37
k get pvc wffc-lab
# wffc-lab   Bound    pvc-87273f83-ce6c-4ed3-8ecd-9da9d6cdbd27   128Mi      RWO            local-path     <unset>                 14s
k get pvc wffc-lab -o yaml | grep selected-node
#     volume.kubernetes.io/selected-node: cka-w1
k describe pvc wffc-lab | sed -n '/^Events/,$p'
#   Normal  WaitForFirstConsumer   15s  persistentvolume-controller  waiting for first consumer to be created before binding
#   Normal  ExternalProvisioning   11s  persistentvolume-controller  Waiting for a volume to be created either by the external provisioner 'rancher.io/local-path' or manually by the system administrator. …
#   Normal  Provisioning           11s  rancher.io/local-path_local-path-provisioner-…  External provisioner is provisioning volume for claim "shop/wffc-lab"
#   Normal  ProvisioningSucceeded  4s   rancher.io/local-path_local-path-provisioner-…  Successfully provisioned volume pvc-87273f83-ce6c-4ed3-8ecd-9da9d6cdbd27
k get pv pvc-87273f83-ce6c-4ed3-8ecd-9da9d6cdbd27 -o yaml | sed -n '/^spec:/,/^status:/p'
\`\`\`

\`\`\`yaml
spec:
  accessModes:
  - ReadWriteOnce
  capacity:
    storage: 128Mi
  claimRef:
    kind: PersistentVolumeClaim
    name: wffc-lab
    namespace: shop
    uid: 87273f83-ce6c-4ed3-8ecd-9da9d6cdbd27
  hostPath:
    path: /opt/local-path-provisioner/pvc-87273f83-ce6c-4ed3-8ecd-9da9d6cdbd27_shop_wffc-lab
    type: DirectoryOrCreate
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - cka-w1
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-path
  volumeMode: Filesystem
\`\`\`

\`\`\`bash
ssh cka-w1 'sudo ls -l /opt/local-path-provisioner/; sudo cat /opt/local-path-provisioner/pvc-87273f83*/hello.txt'
# drwxrwxrwx 2 root root 4096 Nov 15 23:30 pvc-87273f83-ce6c-4ed3-8ecd-9da9d6cdbd27_shop_wffc-lab
# hello
\`\`\`

Thứ tự đúng như phần Tư duy: scheduler chọn cka-w1 cho Pod, ghi \`selected-node\`, provisioner chạy helper Pod trên cka-w1 tạo thư mục (\`mkdir -m 0777\`), tạo PV ghim cka-w1, PVC Bound, Pod chạy. PV chính là một hostPath có nodeAffinity, như PV bạn viết tay ở s22.

**6. Delete: xoá PVC là mất dữ liệu**

\`\`\`bash
k delete pod wffc-pod --now
k delete pvc wffc-lab
k get pv
# NAME        CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM            STORAGECLASS   …
# shop-data   1Gi        RWO            Retain           Bound    shop/shop-data   manual         …
ssh cka-w1 sudo ls /opt/local-path-provisioner/     # thư mục pvc-87273f83… đã bị xoá
echo DELETED_PV=pvc-87273f83-ce6c-4ed3-8ecd-9da9d6cdbd27 >> ~/drills/s23/answers.env
\`\`\`

**7. Retain: PV ở lại, Released**

\`\`\`bash
k apply -f ~/drills/s23/wffc-lab.yaml -f ~/drills/s23/wffc-pod.yaml
k get pvc wffc-lab      # chờ Bound, lấy tên PV ở cột VOLUME
k patch pv pvc-e7a85d77-d388-49fa-aa6a-8c312291b27b -p '{"spec":{"persistentVolumeReclaimPolicy":"Retain"}}'
k delete pod wffc-pod --now
k delete pvc wffc-lab
k get pv --sort-by=.spec.capacity.storage
# NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS     CLAIM            STORAGECLASS   VOLUMEATTRIBUTESCLASS   REASON   AGE
# pvc-e7a85d77-d388-49fa-aa6a-8c312291b27b   128Mi      RWO            Retain           Released   shop/wffc-lab    local-path     <unset>                          11s
# shop-data                                  1Gi        RWO            Retain           Bound      shop/shop-data   manual         <unset>                          5m48s
printf 'RETAINED_PV=pvc-e7a85d77-d388-49fa-aa6a-8c312291b27b\\nRETAINED_PHASE=Released\\n' >> ~/drills/s23/answers.env
\`\`\`

\`CLAIM\` vẫn ghi \`shop/wffc-lab\`: \`claimRef\` giữ cả UID của PVC đã xoá, nên một PVC mới cùng tên cũng không bind vào PV này (s25 dạy cách gỡ). Dọn PV nháp và dữ liệu của nó:

\`\`\`bash
k delete pv pvc-e7a85d77-d388-49fa-aa6a-8c312291b27b
ssh cka-w1 sudo rm -rf /opt/local-path-provisioner/pvc-e7a85d77-d388-49fa-aa6a-8c312291b27b_shop_wffc-lab
k get pv,pvc        # chỉ còn shop-data
\`\`\`

Lời giải tự động: \`labs/cka/sessions/s23/apply.sh\` (sửa manifest bằng PyYAML thay cho vim, rồi làm đúng các bước trên; chạy lại được).`,
    exam: {
      patterns: [
        "\"Tạo StorageClass X, provisioner Y, WaitForFirstConsumer, đặt làm mặc định\" — YAML từ trang Storage Classes, thêm annotation `storageclass.kubernetes.io/is-default-class: \"true\"`; lớp mặc định cũ phải gỡ annotation (đặt `\"false\"`).",
        "\"PVC dùng StorageClass X đang Pending\" — xem Events: `WaitForFirstConsumer` là chờ Pod (bình thường); `storageclass … not found` là sai tên lớp (hoặc, với lớp ghép tay, không PV nào khớp); có Pod rồi mà chỉ thấy `ExternalProvisioning` lặp lại, không có `Provisioning`, là provisioner không chạy hoặc sai tên.",
        "\"Đổi reclaim policy của PV thành Retain\" — `k patch pv … -p '{\"spec\":{\"persistentVolumeReclaimPolicy\":\"Retain\"}}'`.",
        "\"Liệt kê PV sắp theo dung lượng, ghi vào tệp\" — `k get pv --sort-by=.spec.capacity.storage > …`.",
      ],
      timeTargetMin: 8,
      drills: [
        {
          text: "Trong 3 phút: StorageClass `slow` (provisioner `rancher.io/local-path`, `WaitForFirstConsumer`, `reclaimPolicy: Retain`, cho phép mở rộng volume), **không** làm mặc định.",
          timeLimitMin: 3,
          solution: "```yaml\napiVersion: storage.k8s.io/v1\nkind: StorageClass\nmetadata:\n  name: slow\nprovisioner: rancher.io/local-path\nvolumeBindingMode: WaitForFirstConsumer\nreclaimPolicy: Retain\nallowVolumeExpansion: true\n```\n`k get sc`: `slow` không có chữ `(default)`. (local-path không thật sự mở rộng được thư mục; trường này chỉ cho phép sửa PVC.)",
        },
        {
          text: "Trong 2 phút: chuyển lớp mặc định từ `local-path` sang `slow`.",
          timeLimitMin: 2,
          solution: "```bash\nk patch sc local-path -p '{\"metadata\":{\"annotations\":{\"storageclass.kubernetes.io/is-default-class\":\"false\"}}}'\nk patch sc slow -p '{\"metadata\":{\"annotations\":{\"storageclass.kubernetes.io/is-default-class\":\"true\"}}}'\nk get sc\n```",
        },
      ],
    },
    tips: [
      "Trường của StorageClass (`provisioner`, `parameters`, `reclaimPolicy`, `volumeBindingMode`) không sửa được sau khi tạo: sai thì xoá và tạo lại (PV đã sinh không bị ảnh hưởng). Annotation thì patch được.",
      "`k get sc` cho thấy RECLAIMPOLICY và VOLUMEBINDINGMODE ngay, khỏi `describe`.",
      "PVC Pending với SC `WaitForFirstConsumer`: tạo Pod trước khi đi tìm lỗi.",
      "Sau khi xoá PV Retain, dữ liệu vẫn nằm trên node: xoá thư mục bằng tay nếu không cần nữa.",
    ],
    outcome: {
      md: `Cluster cấp volume theo yêu cầu, như cluster của đề thi. Trên Mac:

\`\`\`bash
./labs/lab verify cka s23
\`\`\`

Verify kiểm provisioner (phiên bản ghim, Available, chạy trên cka-cp, image helper Pod có tag), StorageClass mặc định duy nhất, đáp án, đã dọn hết PVC/PV nháp mà PV shop-data của s22 vẫn nguyên, và hai PV của vòng Delete/Retain: đúng là PV động mà Pod wffc-pod đã mount (journal kubelet của worker), nay không còn. Sau khi VM khởi động lại, verify chờ Pod provisioner Ready.`,
      verifyOutput: "lab: kiểm s23\n  (chờ apiserver và local-path-provisioner, nếu đang khởi động: tối đa ~5 phút)\n  ✓ local-path-provisioner (local-path-storage): image ghim phiên bản, Available, Pod chạy trên cka-cp; image helper Pod ghim tag\n  ✓ StorageClass: đúng một mặc định và là local-path (rancher.io/local-path, WaitForFirstConsumer)\n  ✓ answers.env: WFFC_REASON=WaitForFirstConsumer; không còn PVC/PV nháp; PV shop-data vẫn Retain, Bound với shop/shop-data\n  ✓ Vòng Delete và Retain: DELETED_PV, RETAINED_PV là hai PV động Pod wffc-pod đã mount, nay đã xoá; RETAINED_PHASE=Released\n  → 4/4 đạt",
      projectDelta: "Cluster có StorageClass local-path mặc định (WaitForFirstConsumer) do local-path-provisioner cấp. Buổi sau PostgreSQL chạy bằng StatefulSet với volumeClaimTemplates xin volume từ chính lớp này.",
    },
    review: [
      { q: "PVC dùng lớp `WaitForFirstConsumer` đứng Pending 10 phút, Event `WaitForFirstConsumer`. Lỗi không?", a: "Không, nếu chưa có Pod nào dùng nó: PVC chỉ được cấp PV sau khi scheduler chọn node cho Pod đầu tiên (annotation `volume.kubernetes.io/selected-node`). Có Pod rồi mà vẫn Pending thì xem Event của Pod và log của provisioner." },
      { q: "Vì sao storage cục bộ (local-path, local PV) nên dùng `WaitForFirstConsumer` thay vì `Immediate`?", a: "Với Immediate, PV được tạo trên một node đoán trước; nếu Pod vì ràng buộc khác (nodeSelector, taint, thiếu tài nguyên) phải chạy ở node khác thì Pending mãi vì `volume node affinity conflict`. WFFC để scheduler chọn node xét mọi ràng buộc, rồi mới tạo volume ở đó." },
      { q: "Xoá PVC của một PV động `Delete` và một PV `Retain`: khác nhau thế nào?", a: "Delete: provisioner xoá cả PV lẫn dữ liệu (thư mục trên node). Retain: PV ở lại phase `Released`, dữ liệu còn, `claimRef` còn trỏ PVC cũ nên không PVC nào bind được cho tới khi người quản trị xoá PV hoặc gỡ claimRef." },
      { q: "Có hai StorageClass cùng mang annotation mặc định. PVC không ghi lớp nhận lớp nào? Nên làm gì?", a: "Kubernetes chọn lớp mặc định được tạo sau cùng, nhưng đó là cấu hình lỗi: gỡ annotation khỏi lớp thừa (`is-default-class: \"false\"`). `k get sc` phải chỉ một dòng `(default)`." },
      { q: "PVC xin 128Mi từ local-path. Ứng dụng ghi được bao nhiêu?", a: "Tới khi đĩa của node đầy: local-path chỉ tạo một thư mục hostPath, không có quota. Dung lượng trong PVC chỉ dùng để ghép và ghi lên PV." },
    ],
  },

// ───────────────────────────── s24 ─────────────────────────────
  {
    id: "s24",
    stage: "st4",
    title: "StatefulSet cho PostgreSQL và nối shop vào database",
    durationMin: 90,
    domain: "storage",
    competencies: ["st-pv-pvc"],
    requires: ["s23"],
    status: "published",
    pieces: ["postgres"],
    goals: [
      "Chạy PostgreSQL bằng StatefulSet + headless Service + volumeClaimTemplates trên node dành cho db.",
      "Nối catalog và order vào postgres-0 qua tên DNS ổn định và Secret db-cred (HikariCP).",
      "Chứng minh PostgreSQL giữ dữ liệu qua restart; hiểu vì sao lưu trữ cục bộ ghim Pod vào node.",
    ],
    skills: [
      { skill: "k-statefulset-yaml", level: "Viết được có tra" },
      { skill: "k-headless-svc", level: "Viết được không tra" },
      { skill: "k-sts-dns", level: "Giải thích được" },
      { skill: "k-sts-ordering", level: "Giải thích được" },
      { skill: "k-exec-psql", level: "Gõ được không tra" },
    ],
    uses: ["k-secret-env-volume", "k-nodeselector-toleration", "k-default-sc", "k-rollout-restart", "k-probes-yaml", "k-reclaim-policy", "k-label-node", "k-replace-force", "k-get-pv-pvc", "k-failedscheduling-events", "k-logs-previous"],
    foundation: null,
    mindset: `**Deployment coi Pod là hàng loạt, StatefulSet coi Pod là từng cá thể.** Với Deployment, Pod tên \`catalog-6977c4d66f-zdnbh\` chết thì ReplicaSet tạo Pod khác tên khác, IP khác, và nếu có volume thì mọi replica dùng chung một PVC. Database cần ba điều ngược lại, và StatefulSet cho đúng ba điều đó:

| | Deployment | StatefulSet |
|---|---|---|
| Tên Pod | ngẫu nhiên (\`order-5bd7cf8fc-j4xg2\`) | theo số thứ tự: \`postgres-0\`, \`postgres-1\`…; Pod tạo lại **giữ đúng tên** |
| Tên DNS riêng của Pod | không | \`<pod>.<serviceName>.<ns>.svc.cluster.local\`, qua headless Service ghi ở \`spec.serviceName\` |
| Volume | PVC khai trong template: mọi replica dùng chung | \`volumeClaimTemplates\`: **mỗi Pod một PVC** tên \`<template>-<sts>-<số>\` (ở đây \`data-postgres-0\`), Pod tạo lại gắn lại đúng PVC đó |
| Thứ tự | tạo/xoá song song, rolling update theo maxSurge | mặc định \`podManagementPolicy: OrderedReady\`: tạo \`-0\` rồi chờ nó Ready mới tạo \`-1\`; scale down xoá từ số lớn nhất; update từ số lớn về \`-0\` |
| Xoá | xoá Pod, ReplicaSet | xoá StatefulSet hay scale down **không** xoá PVC (\`persistentVolumeClaimRetentionPolicy\` mặc định \`Retain\`/\`Retain\`): dữ liệu ở lại cho tới khi bạn xoá PVC |

StatefulSet **không** tự biến PostgreSQL thành cụm có bản sao: \`replicas: 3\` chỉ cho ba database rỗng độc lập. Sao chép dữ liệu là việc của chính PostgreSQL (streaming replication) hay của một operator (CloudNativePG…). Shop chạy một replica.

**Headless Service: DNS trỏ thẳng Pod.** \`clusterIP: None\` nghĩa là không có IP ảo, kube-proxy không đứng giữa: CoreDNS trả thẳng IP của các Pod Ready. Tên của Service (\`postgres.shop\`) trả mọi Pod; tên riêng \`postgres-0.postgres.shop.svc.cluster.local\` có được vì StatefulSet đặt \`hostname: postgres-0\` và \`subdomain: postgres\` (= \`serviceName\`) cho Pod. Ghi \`serviceName\` khác tên Service thật thì Pod vẫn chạy, chỉ không có tên DNS nào. Pod **chưa Ready** cũng không có bản ghi (trừ khi Service đặt \`publishNotReadyAddresses: true\`): điều này quyết định chuyện gì xảy ra lúc khởi động, xem dưới.

**HikariCP và tên ổn định.** catalog và order dùng HikariCP (pool JDBC mặc định của Spring Boot): mở sẵn tới 10 kết nối (\`maximumPoolSize\`) tới host trong \`DB_URL\` và giữ chúng. Khi \`postgres-0\` bị xoá rồi tạo lại, IP Pod đổi (lab đo: \`10.244.62.183\` thành \`10.244.62.137\`), **tên thì không**. Các kết nối cũ bị PostgreSQL đóng lúc tắt; Hikari kiểm kết nối trước khi cho mượn, bỏ kết nối chết và mở kết nối mới theo tên, tra DNS lại. JVM có cache DNS riêng: tên tra được giữ 30 giây (\`networkaddress.cache.ttl\` mặc định), tên tra hỏng giữ 10 giây. Trỏ \`DB_URL\` vào IP Pod thì lần tạo lại đầu tiên là ứng dụng mất database; trỏ vào tên \`postgres-0.postgres…\` thì không cần sửa gì.

**Thứ tự khởi động sau khi VM bật lại.** Kubernetes không có "khởi động postgres trước": kubelet chạy mọi Pod cùng lúc. Đo trên lab sau \`down\` + \`up\`: một Pod catalog lên trước khi \`postgres-0\` Ready, Spring Boot chạy \`schema.sql\` lúc khởi động nên cần kết nối ngay, tên \`postgres-0.postgres…\` chưa có bản ghi DNS (Pod chưa Ready), JVM thoát với \`java.net.UnknownHostException: postgres-0.postgres.shop.svc.cluster.local\`, Pod \`CrashLoopBackOff\` một lần, lần chạy lại sau 10 giây thì postgres đã Ready và Pod lên bình thường. Tự hồi trong khoảng một phút, nên lab không thêm initContainer chờ postgres. Hệ thống thật hay thêm một initContainer \`until nc -z postgres-0.postgres 5432\` (như \`wait-catalog\` của gateway ở s13) để khỏi đếm restart giả và khỏi chờ backoff dài khi database lên chậm.

**Vì sao không dời được postgres sang node khác.** PV mà local-path cấp là một thư mục \`/opt/local-path-provisioner/pvc-…\` trên đĩa của cka-w2, kèm \`nodeAffinity: kubernetes.io/hostname In [cka-w2]\`. Scheduler phải tôn trọng nó: Pod dùng PVC này chỉ chạy được trên cka-w2. cka-w2 hỏng hay bị cordon thì \`postgres-0\` đứng Pending, không node nào khác nhận, vì dữ liệu không nằm ở đó. Trên Kubernetes 1.36 lý do in ra là \`node(s) didn't match PersistentVolume's node affinity\` (bản cũ ghi \`volume node affinity conflict\`). Muốn Pod database dời được giữa các node thì dữ liệu phải nằm trên storage mạng: NFS, Ceph RBD, đĩa cloud qua CSI (EBS, Persistent Disk… vẫn bị ghim theo zone), để node mới gắn được cùng volume. Với local storage, tính sẵn sàng phải đến từ bản sao ở tầng database, không từ Kubernetes.

**Tài nguyên của postgres.** Đo trên lab: \`postgres-0\` rảnh 33Mi (\`kubectl top\`), \`memory.peak\` của cgroup 53 MiB sau khi seed và 26 kết nối Hikari; lúc catalog/order vừa nối vào tới 76Mi. Lab đặt requests 100m/128Mi, limits memory 256Mi: còn dư cho \`shared_buffers\` 128 MB mặc định khi dữ liệu lớn dần. Quota shop sau buổi: \`requests.memory\` 1408Mi/3Gi, pods 9/20. \`free -m\` cka-w2: trước 985 MB available, sau 924 MB.`,
    refs: [
      { label: "Bài lộ trình Kubernetes in Action: StatefulSet — danh tính ổn định, volume riêng, headless Service", href: "#/roadmap/k8sbook/kb-w8-3" },
      { label: "Bài lộ trình CKA: hostPath vs local volume", href: "#/roadmap/cka/cka-w5-5" },
      { label: "CKA Study Guide, chương 16 — Persistent Volume", href: "#/docs/ckabook-16" },
      { label: "Thực hành nhanh: k get pv,pvc, k describe pvc", href: "#/commands" },
      { label: "kubernetes.io: StatefulSets (pod identity, ordering, PVC retention)", href: "https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/" },
      { label: "kubernetes.io: StatefulSet Basics (tutorial)", href: "https://kubernetes.io/docs/tutorials/stateful-application/basic-stateful-set/" },
      { label: "kubernetes.io: Headless Services", href: "https://kubernetes.io/docs/concepts/services-networking/service/#headless-services" },
      { label: "kubernetes.io: DNS for Services and Pods (hostname, subdomain)", href: "https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/" },
      { label: "Docker Hub: postgres (biến POSTGRES_*, PGDATA)", href: "https://hub.docker.com/_/postgres" },
    ],
    stateIn: "Đầu ra s23: StorageClass local-path là mặc định duy nhất (WaitForFirstConsumer, provisioner trên cka-cp); PV shop-data Bound; Secret db-cred có DB_USER=shop, DB_PASSWORD, catalog và order đọc hai khoá đó qua secretKeyRef nhưng chưa có DB_URL nên vẫn chạy H2 trong bộ nhớ; cka-w2 mang nhãn role=db, không taint. `./labs/lab begin cka s24` kiểm đầu vào bằng verify của s23, tạo ~/drills/s24 và xoá answers.env cũ. cka-w2 cần Internet để kéo image postgres.",
    stateOut: "StatefulSet postgres (1 replica, postgres:17.12-alpine3.24, nodeSelector role=db, 100m/128Mi/256Mi, probe pg_isready) và headless Service postgres trong ~/shop/postgres.yaml; postgres-0 trên cka-w2 với PVC data-postgres-0 (local-path, 1Gi), PV của nó Retain; catalog và order có DB_URL=jdbc:postgresql://postgres-0.postgres.shop.svc.cluster.local:5432/shop, sản phẩm và đơn hàng nằm trong PostgreSQL; cka-w2 schedulable, chỉ cka-w2 mang role=db; ~/drills/s24/answers.env.",
    tasks: [
      { id: "t1", text: "`./labs/lab begin cka s24`. Đo trước: `free -m` trên cka-w2, `k describe quota shop-quota` (còn bao nhiêu `requests.memory`, `pods`?), `k get secret db-cred -o jsonpath='{.data}'` (hai khoá nào?). Đọc phần Tư duy: Pod của StatefulSet có tên gì, PVC tên gì." },
      { id: "t2", text: "`~/shop/postgres.yaml`: headless Service `postgres` (`clusterIP: None`, cổng 5432, selector `app: postgres`) và StatefulSet `postgres` (`serviceName: postgres`, 1 replica, image `postgres:17.12-alpine3.24`, `nodeSelector: role: db`, env `POSTGRES_DB=shop`, `POSTGRES_USER`/`POSTGRES_PASSWORD` từ `db-cred` khoá `DB_USER`/`DB_PASSWORD`, `PGDATA=/var/lib/postgresql/data/pgdata`, readiness và liveness `pg_isready -h 127.0.0.1 -U shop -d shop`, requests 100m/128Mi, limits memory 256Mi, `volumeClaimTemplates` tên `data` 1Gi RWO, không ghi lớp, mount ở `/var/lib/postgresql/data`). Apply, `k get pod,pvc -w` cho tới khi `postgres-0` 1/1. PVC nào tự xuất hiện, lớp nào, PV trên node nào? `k logs postgres-0 | tail`." },
      { id: "t3", text: "Vào database: `k exec -it postgres-0 -- psql -U shop -d shop -c '\\l'`. Database `shop` đã có (do `POSTGRES_DB` lúc initdb); nếu bạn bỏ biến đó thì tạo bằng `psql -U shop -d postgres -c 'CREATE DATABASE shop'`. Tên DNS của Pod: `k run tmp --image=busybox:1.37 --rm -it --restart=Never -- nslookup postgres-0.postgres.shop.svc.cluster.local`, rồi `nslookup postgres.shop.svc.cluster.local`: hai tên trả IP gì, có ClusterIP không? Ghi `STS_POD_DNS=<FQDN của postgres-0>` vào `~/drills/s24/answers.env`." },
      { id: "t4", text: "Nối shop vào database: trong `~/shop/catalog.yaml` và `~/shop/order.yaml` thêm env `DB_URL=jdbc:postgresql://postgres-0.postgres.shop.svc.cluster.local:5432/shop` (giữ `DB_USER`/`DB_PASSWORD` từ db-cred). Apply, `k rollout status deploy/catalog deploy/order`. `k logs deploy/order | grep Hikari`: kết nối tới đâu? `k exec postgres-0 -- psql -U shop -d shop -c '\\dt' -c 'select * from products'`. Gọi qua gateway: `k get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/products`." },
      { id: "t5", text: "Tạo 3 đơn hàng qua gateway: Job `seed` của s15 làm đúng việc đó (`POST /api/orders` ba lần), nên chạy lại nó: `k replace --force -f ~/shop/seed.yaml`, `k wait job/seed --for=condition=Complete`. Đếm: `k exec postgres-0 -- psql -U shop -d shop -c 'select count(*) from orders'`." },
      { id: "t6", text: "Dữ liệu sống qua restart: `k get pod postgres-0 -o wide` (ghi IP), `k delete pod postgres-0`, `k get pod -w`. Pod mới tên gì, IP gì, PVC nào? Đếm lại orders. `/api/products` qua gateway còn chạy không, có phải restart catalog không? Rồi đặt PV của `data-postgres-0` sang `Retain`: `k patch pv $(k get pvc data-postgres-0 -o jsonpath='{.spec.volumeName}') -p '{\"spec\":{\"persistentVolumeReclaimPolicy\":\"Retain\"}}'` (s25 cần điều này)." },
      { id: "t7", text: "Thử dời postgres sang cka-w1: `k label node cka-w1 role=db` (giả như cka-w1 là node db mới), `k cordon cka-w2`, `k delete pod postgres-0`. `k get pod postgres-0 -o wide`, `k describe pod postgres-0 | tail -3`: Pod ở đâu, vì sao? Ghi `MOVE_REASON=<câu FailedScheduling>` vào answers.env. Trả lại: `k label node cka-w1 role-`, `k uncordon cka-w2`, chờ `postgres-0` 1/1 trên cka-w2. Trên Mac: `./labs/lab verify cka s24` phải đạt 6/6." },
    ],
    hints: [
      "`k create` không sinh được StatefulSet. Chép khung từ trang StatefulSets trên kubernetes.io (ví dụ `web` + `nginx`), hoặc `k create deploy postgres --image=… --dry-run=client -o yaml` rồi đổi `kind`, thêm `serviceName`, `volumeClaimTemplates`, bỏ `strategy`.",
      "`volumeClaimTemplates` nằm ở `spec` của StatefulSet, ngang hàng `template`, không nằm trong `template.spec`. Trong container, `volumeMounts[].name` phải trùng `metadata.name` của template (`data`); không khai `volumes` cho nó.",
      "PVC `data-postgres-0` Pending với Event `WaitForFirstConsumer` trong vài giây đầu là bình thường (s23). Pod `postgres-0` Pending lâu: `k describe pod` — `didn't match Pod's node affinity/selector` là nhãn `role=db` không có trên node nào.",
      "initdb báo `directory \"/var/lib/postgresql/data\" exists but is not empty`: với đĩa có `lost+found` (đĩa cloud, ext4 mới format) thư mục mount không rỗng. Vì thế đặt `PGDATA` vào thư mục con `…/data/pgdata`. local-path tạo thư mục rỗng nên không gặp, nhưng thói quen tốt.",
      "catalog/order CrashLoopBackOff sau khi thêm DB_URL: `k logs <pod> --previous | grep 'Caused by'`. `UnknownHostException` là tên sai hoặc postgres chưa Ready (headless không có bản ghi cho Pod chưa Ready); `password authentication failed` là mật khẩu trong db-cred khác lúc initdb; `database \"shop\" does not exist` là thiếu `POSTGRES_DB`.",
      "Đổi mật khẩu trong Secret sau khi initdb không đổi mật khẩu trong PostgreSQL: biến `POSTGRES_*` chỉ được đọc khi thư mục dữ liệu còn rỗng. Muốn đổi thì `ALTER USER shop PASSWORD …` bằng psql.",
      "Để `DB_URL` trong Secret `db-cred` (thay vì env thẳng) cũng được, verify chấp nhận; nhưng sửa Secret không đổi template của Deployment, nên phải `k rollout restart deploy/catalog deploy/order` thì Pod mới đọc biến mới (s12).",
      "`k describe pod postgres-0` khi đang thử dời node: dòng `FailedScheduling` có ba vế cho ba node. Vế của cka-w1 là câu cần ghi vào `MOVE_REASON`; chép nguyên câu có dấu nháy vào answers.env thì bọc giá trị bằng nháy kép.",
    ],
    solution: `Output là của máy soạn bài; tên PV, IP và thời điểm sẽ khác. Context đã ở namespace shop.

**1. Đo trước**

\`\`\`bash
free -m      # trên cka-w2: Mem: 1955 total, 969 used, … 985 available
k describe quota shop-quota | tail -4
# pods             8       20
# requests.cpu     700m    2
# requests.memory  1280Mi  3Gi
k get secret db-cred -o jsonpath='{.data}'; echo
# {"DB_PASSWORD":"…","DB_USER":"c2hvcA=="}
\`\`\`

Còn 1792Mi \`requests.memory\` và 12 Pod trong quota: postgres 128Mi vừa thừa.

**2. Headless Service + StatefulSet** (\`~/shop/postgres.yaml\`)

\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: shop
  labels:
    app: postgres
spec:
  clusterIP: None
  selector:
    app: postgres
  ports:
  - name: postgres
    port: 5432
    targetPort: 5432
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: shop
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      nodeSelector:
        role: db
      terminationGracePeriodSeconds: 30
      containers:
      - name: postgres
        image: postgres:17.12-alpine3.24
        ports:
        - name: postgres
          containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: shop
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: db-cred
              key: DB_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-cred
              key: DB_PASSWORD
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        readinessProbe:
          exec:
            command: ["pg_isready", "-h", "127.0.0.1", "-U", "shop", "-d", "shop"]
          periodSeconds: 5
          timeoutSeconds: 3
        livenessProbe:
          exec:
            command: ["pg_isready", "-h", "127.0.0.1", "-U", "shop", "-d", "shop"]
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 6
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            memory: 256Mi
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes:
      - ReadWriteOnce
      resources:
        requests:
          storage: 1Gi
\`\`\`

\`\`\`bash
k apply -f ~/shop/postgres.yaml
k get pod,pvc -w
# pod/postgres-0   0/1   Pending             0   0s
# persistentvolumeclaim/data-postgres-0   Pending   …   local-path   …
# pod/postgres-0   0/1   ContainerCreating   0   5s
# persistentvolumeclaim/data-postgres-0   Bound   pvc-3d3ef6ae-f7c3-47b0-b059-ffc8fe64e4fc   1Gi   RWO   local-path   …
# pod/postgres-0   1/1   Running             0   65s
k get pv pvc-3d3ef6ae-f7c3-47b0-b059-ffc8fe64e4fc -o jsonpath='{.spec.nodeAffinity.required.nodeSelectorTerms[0].matchExpressions[0].values}'; echo
# ["cka-w2"]
k logs postgres-0 | tail -2
# … LOG:  database system was shut down at 2026-11-15 17:59:27 UTC
# … LOG:  database system is ready to accept connections
\`\`\`

Lần đầu mất khoảng một phút: kéo image (115 MB) về cka-w2, rồi initdb. PVC \`data-postgres-0\` do StatefulSet tạo từ template \`data\`, nhận lớp mặc định \`local-path\`; scheduler xếp Pod lên cka-w2 (nhãn \`role=db\`) và provisioner tạo PV ở đó (WaitForFirstConsumer, s23).

**3. psql và tên DNS**

\`\`\`bash
k exec -it postgres-0 -- psql -U shop -d shop -c '\\l shop'
#  Name | Owner | Encoding | Locale Provider |  Collate   |   Ctype    | …
# ------+-------+----------+-----------------+------------+------------+ …
#  shop | shop  | UTF8     | libc            | en_US.utf8 | en_US.utf8 | …
k run tmp --image=busybox:1.37 --rm -it --restart=Never -- nslookup postgres-0.postgres.shop.svc.cluster.local
# Name:	postgres-0.postgres.shop.svc.cluster.local
# Address: 10.244.62.137
k run tmp --image=busybox:1.37 --rm -it --restart=Never -- nslookup postgres.shop.svc.cluster.local
# Name:	postgres.shop.svc.cluster.local
# Address: 10.244.62.137
k get svc postgres
# NAME       TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)    AGE
# postgres   ClusterIP   None         <none>        5432/TCP   19m
k get pod postgres-0 -o jsonpath='{.spec.hostname} {.spec.subdomain}'; echo
# postgres-0 postgres
echo STS_POD_DNS=postgres-0.postgres.shop.svc.cluster.local >> ~/drills/s24/answers.env
\`\`\`

Cả hai tên đều trả thẳng IP Pod: Service headless không có ClusterIP. Với một replica hai tên giống nhau; với \`replicas: 3\` tên Service trả ba IP, còn \`postgres-0.postgres…\` luôn là đúng một Pod, thứ một kết nối JDBC ghi dữ liệu cần.

**4. DB_URL cho catalog và order**

\`\`\`yaml
# ~/shop/catalog.yaml và ~/shop/order.yaml, trong env của container, sau JAVA_OPTS:
        - name: DB_URL
          value: jdbc:postgresql://postgres-0.postgres.shop.svc.cluster.local:5432/shop
\`\`\`

\`\`\`bash
k apply -f ~/shop/catalog.yaml -f ~/shop/order.yaml
k rollout status deploy/catalog; k rollout status deploy/order
k logs deploy/order | grep Hikari
# … HikariPool-1 - Starting...
# … HikariPool-1 - Added connection org.postgresql.jdbc.PgConnection@1946384
# … HikariPool-1 - Start completed.
k exec postgres-0 -- psql -U shop -d shop -c '\\dt' -c 'select * from products'
#  public | orders   | table | shop
#  public | products | table | shop
#   1 | Bàn phím cơ      |  49.90
#   2 | Chuột không dây  |  19.90
#   3 | Màn hình 27 inch | 229.00
k get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/products; echo
# [{"id":1,"name":"Bàn phím cơ","price":49.90},{"id":2,"name":"Chuột không dây","price":19.90},{"id":3,"name":"Màn hình 27 inch","price":229.00}]
\`\`\`

Trước đó log ghi \`Added connection conn0: url=jdbc:h2:mem:shop\`. Hai service chạy \`schema.sql\`/\`data.sql\` của mình lúc khởi động (chạy lại nhiều lần không lỗi), nên bảng và 3 sản phẩm tự có. Đổi env trong template là đổi Pod template: Deployment tự rollout, không cần \`rollout restart\`.

**5. Ba đơn hàng qua gateway**

\`\`\`bash
k replace --force -f ~/shop/seed.yaml
k wait job/seed --for=condition=Complete --timeout=300s
k exec postgres-0 -- psql -U shop -d shop -c 'select * from orders'
#  id | product_id | qty |         created_at
# ----+------------+-----+----------------------------
#   1 |          1 |   2 | 2026-11-15 18:00:16.212942
#   2 |          1 |   2 | 2026-11-15 18:00:21.043267
#   3 |          1 |   2 | 2026-11-15 18:00:24.785456
\`\`\`

**6. Xoá postgres-0, dữ liệu còn**

\`\`\`bash
k get pod postgres-0 -o wide       # IP 10.244.62.183, cka-w2
k delete pod postgres-0
k get pod postgres-0 -o wide
# postgres-0   1/1   Running   0   30s   10.244.62.137   cka-w2   …
k exec postgres-0 -- psql -U shop -d shop -tAc 'select count(*) from orders'
# 3
k get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/products | head -c 60; echo
# [{"id":1,"name":"Bàn phím cơ","price":49.90},{"id":2,"name"
k patch pv pvc-3d3ef6ae-f7c3-47b0-b059-ffc8fe64e4fc -p '{"spec":{"persistentVolumeReclaimPolicy":"Retain"}}'
k get pv
# pvc-3d3ef6ae-…   1Gi   RWO   Retain   Bound   shop/data-postgres-0   local-path   …
# shop-data        1Gi   RWO   Retain   Bound   shop/shop-data         manual       …
\`\`\`

Cùng tên, cùng PVC, khác IP. catalog không restart: HikariCP bỏ kết nối chết, mở kết nối mới theo tên DNS.

**7. Thử dời sang cka-w1**

\`\`\`bash
k label node cka-w1 role=db
k cordon cka-w2
k delete pod postgres-0
k get pod postgres-0 -o wide
# postgres-0   0/1   Pending   0   5s   <none>   <none>   …
k describe pod postgres-0 | tail -1
#   Warning  FailedScheduling  …  0/3 nodes are available: 1 node(s) didn't match PersistentVolume's node affinity, 1 node(s) had untolerated taint(s), 1 node(s) were unschedulable. no new claims to deallocate, preemption: 0/3 nodes are available: 3 Preemption is not helpful for scheduling.
echo "MOVE_REASON=1 node(s) didn't match PersistentVolume's node affinity" >> ~/drills/s24/answers.env
k label node cka-w1 role-
k uncordon cka-w2
k get pod postgres-0 -o wide      # lại Running trên cka-w2
\`\`\`

Ba vế cho ba node: cka-w1 có nhãn \`role=db\` nhưng PV của \`data-postgres-0\` chỉ ở cka-w2; cka-cp có taint control plane; cka-w2 đang cordon. Thêm node không cứu được: dữ liệu ở đâu Pod ở đó. Không có bước 7, Pod chỉ Pending với \`didn't match Pod's node affinity/selector\` trên cka-w1 (filter nhãn chạy trước filter volume), và bạn sẽ không thấy lý do thật.

Lời giải tự động: \`labs/cka/sessions/s24/apply.sh\` (sửa hai tệp Deployment bằng PyYAML thay cho vim, rồi làm đúng các bước trên; chạy lại được).`,
    exam: {
      patterns: [
        "\"Tạo StatefulSet X với headless Service Y, mỗi Pod một PVC Z Gi\" — khung từ trang StatefulSets; ba thứ phải khớp: `spec.serviceName` = tên Service, selector = nhãn template, `volumeMounts[].name` = tên trong `volumeClaimTemplates`.",
        "\"Tên DNS của Pod thứ hai của StatefulSet web trong namespace app\" — `web-1.<serviceName>.app.svc.cluster.local`.",
        "\"Scale StatefulSet về 1, PVC của Pod bị xoá có còn không?\" — còn (`data-web-1` vẫn Bound); scale lên lại thì `web-1` gắn lại đúng PVC đó.",
        "\"Pod Pending, lý do didn't match PersistentVolume's node affinity\" — PV local/hostPath ghim node khác node Pod được phép chạy: sửa ràng buộc của Pod hoặc chấp nhận node đó, không sửa được bằng cách thêm node.",
      ],
      timeTargetMin: 10,
      drills: [
        {
          text: "Trong 6 phút: headless Service `web` và StatefulSet `web` (2 replica, nginx:1.29, cổng 80, `volumeClaimTemplates` `www` 64Mi RWO mount ở `/usr/share/nginx/html`) trong namespace default. Kiểm `k get pvc` có hai PVC.",
          timeLimitMin: 6,
          solution: "```yaml\napiVersion: v1\nkind: Service\nmetadata:\n  name: web\nspec:\n  clusterIP: None\n  selector:\n    app: web\n  ports:\n  - port: 80\n---\napiVersion: apps/v1\nkind: StatefulSet\nmetadata:\n  name: web\nspec:\n  serviceName: web\n  replicas: 2\n  selector:\n    matchLabels:\n      app: web\n  template:\n    metadata:\n      labels:\n        app: web\n    spec:\n      containers:\n      - name: nginx\n        image: nginx:1.29\n        ports:\n        - containerPort: 80\n        volumeMounts:\n        - name: www\n          mountPath: /usr/share/nginx/html\n  volumeClaimTemplates:\n  - metadata:\n      name: www\n    spec:\n      accessModes: [ReadWriteOnce]\n      resources:\n        requests:\n          storage: 64Mi\n```\n`k get pod -w`: `web-1` chỉ được tạo sau khi `web-0` Ready. `k get pvc`: `www-web-0`, `www-web-1`. Dọn: `k delete sts web; k delete svc web; k delete pvc www-web-0 www-web-1`.",
        },
        {
          text: "Trong 2 phút: đếm số dòng bảng `orders` trong database `shop` của Pod `postgres-0`, ghi con số vào `/tmp/orders.txt`.",
          timeLimitMin: 2,
          solution: "```bash\nk -n shop exec postgres-0 -- psql -U shop -d shop -tAc 'select count(*) from orders' > /tmp/orders.txt\n```\n`-t` bỏ tiêu đề, `-A` bỏ căn lề: chỉ còn con số.",
        },
      ],
    },
    tips: [
      "Không có `k create statefulset`: nhớ đường tới trang StatefulSets trên kubernetes.io, ví dụ ở đầu trang có đủ headless Service + StatefulSet + `volumeClaimTemplates`.",
      "`k get pvc` sau khi tạo StatefulSet: tên PVC là `<template>-<sts>-<số>`. Thấy tên đó là biết PVC nào thuộc Pod nào.",
      "`k exec … -- psql -tAc '…'` trả đúng giá trị, tiện cho script và cho đề \"ghi kết quả vào tệp\".",
      "Xoá StatefulSet không xoá PVC: muốn làm lại sạch thì xoá cả `pvc data-postgres-0` (và PV nếu Retain).",
    ],
    outcome: {
      md: `shop đọc ghi PostgreSQL thật, dữ liệu sống qua restart. Trên Mac:

\`\`\`bash
./labs/lab verify cka s24
\`\`\`

Verify kiểm StatefulSet, headless Service và tệp \`~/shop/postgres.yaml\`, PVC và PV (Retain, ghim cka-w2), \`DB_URL\` của catalog và order, đếm bảng bằng \`psql\` trong \`postgres-0\` (3 sản phẩm, ít nhất 3 đơn; \`postgres-0\` phải được tạo sau đơn thứ ba, tức bạn đã xoá nó và dữ liệu vẫn còn), \`/api/products\` qua gateway, node đã trả lại và hai đáp án. Sau khi VM khởi động lại, verify chờ \`postgres-0\` và các JVM (catalog có thể restart một lần vì lên trước postgres).`,
      verifyOutput: "lab: kiểm s24\n  (chờ apiserver, postgres-0 và bốn Deployment, nếu đang khởi động: tối đa ~7 phút)\n  ✓ StatefulSet postgres 1/1 (postgres:17-alpine, nodeSelector role=db, requests/limits, probe pg_isready, mật khẩu từ db-cred), Pod postgres-0 trên cka-w2; Service postgres headless; ~/shop/postgres.yaml khớp\n  ✓ PVC data-postgres-0 Bound (local-path, 1Gi, RWO), PV của nó Retain và ghim cka-w2\n  ✓ catalog, order: DB_URL=jdbc:postgresql://postgres-0.postgres.shop.svc.cluster.local:5432/shop, DB_USER/DB_PASSWORD từ db-cred, Available; ~/shop/{catalog,order}.yaml khớp\n  ✓ PostgreSQL: products 3 dòng, orders ≥ 3 dòng (psql trong postgres-0); postgres-0 được tạo lại sau đơn thứ ba; gateway /api/products trả 3 sản phẩm\n  ✓ answers.env: MOVE_REASON có “didn't match PersistentVolume's node affinity”; cka-w2 đã uncordon, chỉ cka-w2 mang nhãn role=db\n  ✓ answers.env: STS_POD_DNS=postgres-0.postgres.shop.svc.cluster.local\n  → 6/6 đạt",
      projectDelta: "PostgreSQL chạy bằng StatefulSet trên cka-w2, catalog và order dùng nó qua tên postgres-0.postgres. Buổi sau là sự cố: PVC Pending, order mất database và PVC của postgres bị xoá — PV Retain của hôm nay là thứ cứu dữ liệu.",
    },
    review: [
      { q: "StatefulSet `postgres` có `serviceName: db` nhưng Service tên `postgres`. Điều gì hỏng?", a: "Pod vẫn chạy, nhưng `subdomain` của Pod là `db`, không có Service headless nào tên `db`, nên `postgres-0.db…` lẫn `postgres-0.postgres…` đều không phân giải. Ứng dụng gặp `UnknownHostException`." },
      { q: "Xoá Pod `postgres-0`. Pod mới khác gì, giống gì Pod cũ?", a: "Giống: tên `postgres-0`, tên DNS, PVC `data-postgres-0` (và dữ liệu), node (PV ghim cka-w2). Khác: UID, IP. Ứng dụng nối bằng tên nên không cần sửa." },
      { q: "`k scale sts postgres --replicas=0` rồi về 1: dữ liệu còn không?", a: "Còn. Scale down xoá Pod nhưng không xoá PVC (`persistentVolumeClaimRetentionPolicy.whenScaled` mặc định Retain); Pod `postgres-0` mới gắn lại `data-postgres-0`." },
      { q: "Vì sao không dời được postgres-0 sang cka-w1 khi cka-w2 bảo trì, và cần gì để dời được?", a: "PV local-path là thư mục trên đĩa cka-w2 có nodeAffinity cka-w2: scheduler chỉ cho Pod chạy ở đó (`didn't match PersistentVolume's node affinity`). Cần storage mạng (NFS, Ceph, đĩa cloud qua CSI) để node khác gắn được cùng volume, hoặc bản sao ở tầng database." },
      { q: "Sau khi VM khởi động lại, một Pod catalog CrashLoopBackOff một lần với `UnknownHostException: postgres-0.postgres…` rồi tự lên. Vì sao, và khi nào nên thêm initContainer chờ?", a: "kubelet chạy mọi Pod cùng lúc; catalog cần database ngay lúc khởi động (schema.sql), mà Service headless chỉ có bản ghi DNS cho Pod Ready, nên tên chưa phân giải được. Lần restart sau postgres đã Ready. Khi database lên chậm (restore lớn), backoff tăng tới 5 phút: initContainer `until nc -z …` tránh restart giả và lên ngay khi database sẵn sàng." },
    ],
  },

// ───────────────────────────── s25 ─────────────────────────────
  {
    id: "s25",
    stage: "st4",
    title: "Sự cố chặng 4: PVC Pending và dữ liệu biến mất",
    durationMin: 75,
    domain: "troubleshooting",
    competencies: ["ts-logs"],
    requires: ["s24"],
    status: "published",
    pieces: [],
    goals: [
      "Đưa PVC Pending về Bound bằng cách đọc Events của PVC chứ không đoán.",
      "Lần theo log ứng dụng để biết vì sao order báo lỗi kết nối database, rồi sửa tận gốc.",
      "Lấy lại dữ liệu từ một PV đã Released.",
    ],
    skills: [
      { skill: "k-pvc-pending-reasons", level: "Nhận ra trong 1 phút" },
      { skill: "k-pv-release", level: "Gõ được có tra" },
      { skill: "lx-df-du", level: "Gõ được không tra" },
      { skill: "k-pvc-protection", level: "Giải thích được" },
      { skill: "k-logs-all-containers", level: "Gõ được không tra" },
    ],
    uses: ["k-describe-pvc", "k-get-sc", "k-reclaim-policy", "k-logs-previous", "k-exec-psql", "k-get-pv-pvc", "k-events-sorted", "k-get-wide", "k-sts-dns"],
    foundation: null,
    mindset: `**Quy trình chẩn đoán lưu trữ: đi từ PVC xuống node, rồi mới lên ứng dụng.** Lỗi lưu trữ hiếm khi hiện ra ở chỗ nó xảy ra: bạn thấy Pod Pending, ứng dụng báo lỗi kết nối, hoặc "dữ liệu mất". Đi theo đúng thứ tự này:

1. **PVC**: \`k get pvc\` — \`Pending\` hay \`Bound\`, với VOLUME và STORAGECLASS nào. Không có PVC mà workload cần nó thì đó là lỗi đầu tiên.
2. **Events của PVC**: \`k describe pvc <tên> | sed -n '/^Events/,$p'\`. Câu thông báo gần như luôn chỉ thẳng nguyên nhân (bảng dưới).
3. **StorageClass và PV**: \`k get sc\` (lớp có tồn tại, có \`(default)\`, provisioner nào), \`k get pv\` (STATUS, CLAIM, RECLAIM POLICY). PV \`Released\` nghĩa là PVC cũ đã bị xoá và dữ liệu còn đó.
4. **Node**: PV local nằm trên node nào (\`nodeAffinity\`, \`hostPath.path\`), thư mục còn không, đĩa đầy không (\`df -h\`, \`du -sh\`).
5. **Ứng dụng**: \`k logs\` (thêm \`--previous\` khi CrashLoopBackOff, \`--all-containers\` khi có init container hay sidecar), tìm dòng \`Caused by\` cuối cùng.

| Event / trạng thái của PVC | Nghĩa | Sửa |
|---|---|---|
| \`ProvisioningFailed … storageclass.storage.k8s.io "X" not found\` | ghi sai tên lớp (hoặc, với ghép tay, không PV nào khớp: s22) | sửa \`storageClassName\`: trường này không sửa được trên PVC, phải xoá và tạo lại |
| \`WaitForFirstConsumer\` | chưa có Pod dùng PVC | bình thường (s23); có Pod rồi thì xem Event của Pod |
| \`ExternalProvisioning\` lặp lại, không có \`Provisioning\` | provisioner không chạy hoặc sai tên | \`k -n local-path-storage get pod\`, log provisioner |
| \`Pending\`, không Event, \`storageClassName\` rỗng | không có lớp mặc định | đặt annotation mặc định (s23) |
| không PV nào khớp access mode/dung lượng (ghép tay) | PVC xin nhiều hơn hoặc RWX | sửa PVC hoặc PV (s22) |

Với Pod, PVC chưa bind hiện ra ở \`FailedScheduling\` là \`pod has unbound immediate PersistentVolumeClaims\`: đó là triệu chứng, nguyên nhân nằm ở Event của PVC.

**PV Released: vì sao không tự dùng lại, và hai cách lấy lại.** Xoá PVC của một PV \`Retain\` thì PV sang \`Released\`, dữ liệu còn nguyên, nhưng \`spec.claimRef\` vẫn ghi \`namespace\`, \`name\` **và \`uid\`** của PVC đã chết. PVC mới cùng tên có UID khác, nên PV controller không bind. Hai cách:

- **Giữ chỗ theo tên** (lab dùng): xoá \`claimRef.uid\` và \`claimRef.resourceVersion\`, giữ \`namespace\`/\`name\`. PV về \`Available\` nhưng *đã hẹn* cho đúng \`shop/data-postgres-0\`: PVC nào tên đó (StatefulSet tạo lại từ \`volumeClaimTemplates\`) sẽ bind vào nó, PVC khác thì không.
- **Gỡ hẳn \`claimRef\`** (\`k patch pv <pv> --type=json -p '[{"op":"remove","path":"/spec/claimRef"}]'\`) rồi tạo PVC ghi \`spec.volumeName: <pv>\`. Cẩn thận: từ lúc PV \`Available\` không hẹn ai tới lúc PVC của bạn tới, **bất kỳ** PVC nào khớp lớp \`local-path\`, RWO, ≤ 1Gi (ví dụ PVC \`reports\` 256Mi hôm nay) đều có thể lấy mất nó.

Thứ tự quan trọng: nếu bạn \`k apply -f ~/shop/postgres.yaml\` **trước** khi giải phóng PV cũ, StatefulSet tạo PVC \`data-postgres-0\` mới, local-path cấp một PV mới rỗng, initdb chạy lại và shop "mất" dữ liệu (bảng \`orders\` còn không có, vì catalog/order chỉ chạy \`schema.sql\` lúc khởi động). Sửa: xoá StatefulSet và PVC mới (PV mới là \`Delete\`, đi theo), rồi làm lại đúng thứ tự.

**Finalizer \`kubernetes.io/pvc-protection\`.** Mỗi PVC có finalizer này. \`k delete pvc\` chỉ đặt \`deletionTimestamp\`; controller chỉ gỡ finalizer (để PVC biến mất) khi không còn Pod nào dùng PVC. Vì thế PVC đang được Pod dùng đứng \`Terminating\` thay vì mất đột ngột dưới chân database. "Dùng" ở đây là Pod đã được xếp lên node: đo trên lab, PVC \`reports\` mà Pod duy nhất còn Pending (chưa có node) bị xoá ngay, không qua \`Terminating\`. Lúc "đồng nghiệp" xoá \`data-postgres-0\` thì khác: lệnh xoá chờ cho tới khi \`postgres-0\` (Pod của StatefulSet vừa xoá) tắt hẳn. PV có finalizer tương tự \`kubernetes.io/pv-protection\` khi còn bind với PVC. Muốn xoá thì xoá thứ đang dùng nó trước (Deployment, StatefulSet), đừng gỡ finalizer bằng tay.

**Đọc lỗi JDBC.** Ba câu \`Caused by\` cuối thường gặp với PostgreSQL trên Kubernetes, mỗi câu chỉ một tầng:

| Dòng cuối | Tầng hỏng |
|---|---|
| \`java.net.UnknownHostException: postgres-0.postgres.shop.svc.cluster.local\` | DNS: sai tên, Service không có, hoặc Pod database chưa Ready / không tồn tại (headless chỉ có bản ghi cho Pod Ready) |
| \`Connection to postgres-0.postgres…:5433 refused\` | tên đúng, tới được Pod, nhưng không ai nghe ở cổng đó: sai cổng, hay postgres chưa lên |
| \`The connection attempt failed\` + \`SocketTimeoutException\` | gói tin bị chặn (NetworkPolicy, s31) |
| \`FATAL: password authentication failed for user "shop"\` | tới được database, sai mật khẩu |

Spring Boot cần kết nối ngay lúc khởi động (\`schema.sql\`), nên lỗi cấu hình làm JVM thoát và Pod \`CrashLoopBackOff\`: log của lần chạy hiện tại có thể mới vài dòng, lỗi nằm ở \`--previous\`. Còn Pod đã chạy từ trước thì sống tiếp: HikariCP chỉ ghi \`Pool is empty, failed to create/setup connection\` và request trả lỗi 500, Pod vẫn Ready vì readiness của shop không kiểm database. Rolling update của order (1 replica, \`maxUnavailable\` làm tròn về 0) giữ Pod cũ trong lúc Pod mới hỏng, nên \`READY 1/1\` không có nghĩa là \`DB_URL\` đúng.

**Dung lượng.** local-path không giới hạn dung lượng: PVC 1Gi chỉ là con số để ghép. Dữ liệu thật là thư mục trên đĩa 15G của node: \`df -h /opt/local-path-provisioner\` cho biết đĩa còn bao nhiêu, \`sudo du -sh /opt/local-path-provisioner/*\` cho biết mỗi volume chiếm bao nhiêu. Đĩa node đầy thì kubelet báo \`DiskPressure\`, evict Pod, và PostgreSQL dừng ghi.`,
    refs: [
      { label: "Bài lộ trình CKA: Trạng thái PV — Available / Bound / Released — vì sao Released không bind lại được", href: "#/roadmap/cka/cka-w5-6" },
      { label: "Bài lộ trình CKA: StorageClass & dynamic provisioning; WaitForFirstConsumer", href: "#/roadmap/cka/cka-w5-2" },
      { label: "Bài lộ trình CKAD: Lỗi phổ biến — ImagePullBackOff, CrashLoopBackOff, Pending, OOMKilled", href: "#/roadmap/ckad/w5-7" },
      { label: "CKA Study Guide, chương 16 — Persistent Volume", href: "#/docs/ckabook-16" },
      { label: "CKA Study Guide, chương 21 — Xử lý sự cố ứng dụng", href: "#/docs/ckabook-21" },
      { label: "Thực hành nhanh: k describe pvc, k logs --previous", href: "#/commands" },
      { label: "kubernetes.io: Persistent Volumes (Reclaiming, Retain, Storage Object in Use Protection)", href: "https://kubernetes.io/docs/concepts/storage/persistent-volumes/" },
      { label: "kubernetes.io: Debug Pods", href: "https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/" },
      { label: "kubernetes.io: kubectl logs", href: "https://kubernetes.io/docs/reference/kubectl/generated/kubectl_logs/" },
    ],
    stateIn: "Đầu ra s24. Trên Mac chạy `./labs/lab begin cka s25`: lệnh kiểm đầu vào rồi **gây sự cố**: \"một đồng nghiệp\" thêm một ứng dụng nháp cần volume, sửa một tệp trong `~/shop/` rồi apply, và \"dọn\" database. `~/shop/order.yaml` được ghi lại bằng một công cụ YAML: comment và cách viết danh sách có thể đổi. Không nói đã làm gì. Bấm giờ 20 phút. Muốn làm lại từ đầu giữa chừng: chạy lại `./labs/lab begin cka s25` (đặt lại sự cố, xoá đáp án cũ). Đừng đọc `labs/cka/breaks/` trước khi làm xong.",
    stateOut: "Mọi PVC trong shop Bound, không PV Released nào của shop; postgres-0 trên cka-w2 với PVC data-postgres-0 bind vào đúng PV Retain của s24, PostgreSQL giữ đủ dữ liệu như cuối s24; catalog và order đọc ghi bình thường, ~/shop/order.yaml có DB_URL cổng 5432; PVC reports (local-path) Bound và Deployment reports chạy, ~/shop/reports.yaml khớp; ~/drills/s25/answers.env.",
    tasks: [
      { id: "t1", text: "Toàn cảnh, chưa sửa gì: `k get pod -o wide | grep -v Completed`, `k get pvc,pv`, `k get sts,deploy`. Gọi `k get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/products`. Có những triệu chứng nào? Ghi ra trước khi đào." },
      { id: "t2", text: "PVC Pending: `k describe pvc` của PVC đó, đọc Events; `k describe pod` của Pod dùng nó (`FailedScheduling` nói gì?). `k get sc`. Sửa `storageClassName` trong tệp của nó ở `~/shop/` cho đúng lớp có thật. Thử `k apply` (đọc lỗi). Trước khi xoá PVC: `k get pvc <pvc> -o jsonpath='{.metadata.finalizers}'`, ghi `PROTECTION_FINALIZER=<finalizer>` vào `~/drills/s25/answers.env`; `k describe pvc <pvc> | grep 'Used By'`. Xoá PVC: nó mất ngay hay đứng Terminating, vì sao (Tư duy)? Apply lại tệp, chờ PVC Bound và Deployment Available (Pod đang Pending tự được xếp khi PVC mới có)." },
      { id: "t3", text: "Database: StatefulSet và PVC của postgres đâu? `k get pv`: PV nào `Released`, CLAIM ghi gì, RECLAIM POLICY gì? `k get pv <pv> -o jsonpath='{.spec.claimRef}'`. Dữ liệu còn không: thư mục của PV nằm ở đâu (`spec.hostPath.path`, `nodeAffinity`), trên node đó `df -h /opt/local-path-provisioner` và `sudo du -sh /opt/local-path-provisioner/*`." },
      { id: "t4", text: "Lấy lại dữ liệu, **đúng thứ tự**: trước tiên cho PV Released giữ chỗ cho `shop/data-postgres-0` (xoá `claimRef.uid` và `claimRef.resourceVersion`, xem Tư duy), `k get pv` phải `Available` với CLAIM vẫn ghi `shop/data-postgres-0`; rồi mới `k apply -f ~/shop/postgres.yaml`. `k get pvc data-postgres-0`: VOLUME có đúng tên PV cũ không? Đếm `orders` bằng psql." },
      { id: "t5", text: "order: `k get pod -l app=order`, `k logs deploy/order --all-containers --since=10m | grep 'Caused by'`, với Pod CrashLoopBackOff thêm `k logs <pod> --previous`. Câu `Caused by` cuối nói tầng nào hỏng (Tư duy)? Đọc `DB_URL` trong `~/shop/order.yaml`, sửa, apply, `k rollout status deploy/order`. Gọi lại `/api/products` và `GET /api/orders` qua gateway. Trên Mac: `./labs/lab verify cka s25` phải đạt 6/6." },
    ],
    hints: [
      "Ba lỗi chồng lên nhau và che nhau: lúc chưa có database, order *mới* và catalog đều báo `UnknownHostException`, nên lỗi cổng của order chỉ lộ ra **sau** khi postgres chạy lại. Sửa database trước, đọc log order sau.",
      "`storageClassName` của PVC không sửa được (`spec is immutable after creation`): xoá PVC rồi tạo lại. PVC mà Pod đang chạy trên node dùng thì `k delete pvc` đứng `Terminating` cho tới khi Pod đó mất (finalizer, không phải lỗi): xoá hay scale Deployment về 0 trước. PVC chỉ có Pod Pending chưa xếp được thì xoá ngay.",
      "Lớp có thật: `k get sc`. Đừng tạo StorageClass `fast-ssd` cho vừa PVC: đề sự cố là \"ứng dụng ghi sai tên lớp\", sửa ở ứng dụng.",
      "PV Released mà bạn `k delete pv` là mất dấu dữ liệu (thư mục vẫn trên node, nhưng phải viết tay PV mới trỏ vào nó). Đừng xoá PV: sửa `claimRef`.",
      "Xoá hai trường của claimRef: `k patch pv <pv> --type=json -p '[{\"op\":\"remove\",\"path\":\"/spec/claimRef/uid\"},{\"op\":\"remove\",\"path\":\"/spec/claimRef/resourceVersion\"}]'`. Hoặc `k edit pv <pv>` và xoá hai dòng đó.",
      "Lỡ apply postgres.yaml trước: `k get pvc data-postgres-0` trỏ PV mới (RECLAIM POLICY `Delete`), `psql` báo `relation \"orders\" does not exist`. `k delete sts postgres`, `k delete pvc data-postgres-0` (PV mới bị xoá theo), rồi làm lại t4.",
      "`k logs deploy/order` chọn một Pod bất kỳ của Deployment (có thể là Pod cũ còn chạy). Muốn đúng Pod đang hỏng thì gọi theo tên Pod.",
    ],
    solution: `Quy trình dưới đây là cách tìm ra lỗi, không chỉ lệnh sửa. Output là của máy soạn bài; tên Pod, tên PV và thời điểm sẽ khác.

**1. Toàn cảnh**

\`\`\`bash
k get pod -o wide | grep -v Completed
# catalog-6977c4d66f-bnmd7   1/1   Running            1 (21m ago)   28m    10.244.62.188   cka-w2   …
# catalog-6977c4d66f-zdnbh   1/1   Running            2 (20m ago)   28m    10.244.95.185   cka-w1   …
# gateway-55f6b8dc58-vg9jf   1/1   Running            2 (21m ago)   23h    10.244.62.191   cka-w2   …
# …
# order-5bd7cf8fc-j4xg2      1/1   Running            1 (21m ago)   28m    10.244.62.186   cka-w2   …
# order-6764866d-wkndl       0/1   CrashLoopBackOff   4 (72s ago)   3m4s   10.244.95.149   cka-w1   …
# reports-f5c4559f8-ngvsq    0/1   Pending            0             3m4s   <none>          <none>   …
k get pvc,pv
# persistentvolumeclaim/reports     Pending                         fast-ssd   …
# persistentvolumeclaim/shop-data   Bound     shop-data   1Gi   RWO   manual   …
# persistentvolume/pvc-3d3ef6ae-f7c3-47b0-b059-ffc8fe64e4fc   1Gi   RWO   Retain   Released   shop/data-postgres-0   local-path   …
# persistentvolume/shop-data                                  1Gi   RWO   Retain   Bound      shop/shop-data         manual       …
k get sts
# No resources found in shop namespace.
k get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/products
# Error from server (InternalError): an error on the server ("unknown") has prevented the request from succeeding
\`\`\`

Bốn triệu chứng: một Deployment lạ (\`reports\`) Pending, order có Pod mới CrashLoopBackOff (Pod cũ vẫn \`1/1\`), không còn StatefulSet hay PVC \`data-postgres-0\` nhưng PV của nó \`Released\`, và \`/api/products\` lỗi 500. Không có database thì mọi thứ khác đều mù: làm lưu trữ trước.

**2. PVC reports Pending**

\`\`\`bash
k describe pvc reports | sed -n '/^Events/,$p'
#   Warning  ProvisioningFailed  14s (x13 over 3m4s)  persistentvolume-controller  storageclass.storage.k8s.io "fast-ssd" not found
k describe pod -l app=reports | tail -1
#   Warning  FailedScheduling  2m59s  default-scheduler  0/3 nodes are available: pod has unbound immediate PersistentVolumeClaims. not found
k get sc
# NAME                   PROVISIONER             RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGE
# local-path (default)   rancher.io/local-path   Delete          WaitForFirstConsumer   false                  …
\`\`\`

Event của Pod chỉ nói "PVC chưa bind"; Event của PVC nói vì sao. Sửa \`storageClassName: fast-ssd\` thành \`local-path\` trong \`~/shop/reports.yaml\`:

\`\`\`bash
k apply -f ~/shop/reports.yaml
# deployment.apps/reports unchanged
# The PersistentVolumeClaim "reports" is invalid: spec: Forbidden: spec is immutable after creation except resources.requests and volumeAttributesClassName for bound claims
k get pvc reports -o jsonpath='{.metadata.finalizers}'; echo
# ["kubernetes.io/pvc-protection"]
echo PROTECTION_FINALIZER=kubernetes.io/pvc-protection >> ~/drills/s25/answers.env
k delete pvc reports          # mất ngay: Pod reports chưa từng được xếp lên node
k apply -f ~/shop/reports.yaml
k get pvc reports; k rollout status deploy/reports
# reports   Bound   pvc-0c745895-a850-4dd2-8244-c4989266fa6a   256Mi   RWO   local-path   …
\`\`\`

Pod reports đang Pending không cần tạo lại: scheduler thử lại khi PVC mới xuất hiện, WaitForFirstConsumer cấp PV trên node nó chọn. Nếu Pod reports đã chạy trên một node, \`k delete pvc reports\` sẽ đứng \`Terminating\` cho tới khi Pod đó mất.

**3. PV Released: dữ liệu còn không?**

\`\`\`bash
k get pv pvc-3d3ef6ae-f7c3-47b0-b059-ffc8fe64e4fc -o jsonpath='{.spec.claimRef}'; echo
# {"apiVersion":"v1","kind":"PersistentVolumeClaim","name":"data-postgres-0","namespace":"shop","resourceVersion":"…","uid":"a96f4a63-4406-4275-8f92-95e254791319"}
k get pv -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,CLAIM:.spec.claimRef.name,UID:.spec.claimRef.uid
# NAME                                       STATUS     CLAIM             UID
# pvc-3d3ef6ae-f7c3-47b0-b059-ffc8fe64e4fc   Released   data-postgres-0   a96f4a63-4406-4275-8f92-95e254791319
# shop-data                                  Bound      shop-data         b1eaecbd-4bb6-43fc-a574-ad6bb2c04855
k get pv pvc-3d3ef6ae-f7c3-47b0-b059-ffc8fe64e4fc -o jsonpath='{.spec.hostPath.path} {.spec.nodeAffinity.required.nodeSelectorTerms[0].matchExpressions[0].values}'; echo
# /opt/local-path-provisioner/pvc-3d3ef6ae-f7c3-47b0-b059-ffc8fe64e4fc_shop_data-postgres-0 ["cka-w2"]
ssh cka-w2 'df -h /opt/local-path-provisioner; sudo du -sh /opt/local-path-provisioner/*'
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/sda1        14G  5.2G  8.4G  39% /
# 47M	/opt/local-path-provisioner/pvc-3d3ef6ae-f7c3-47b0-b059-ffc8fe64e4fc_shop_data-postgres-0
\`\`\`

47 MB dữ liệu PostgreSQL còn nguyên trên cka-w2, đĩa còn 8,4G. PV giữ UID của PVC đã xoá, nên PVC mới cùng tên sẽ không bind.

**4. Lấy lại dữ liệu, đúng thứ tự**

\`\`\`bash
k patch pv pvc-3d3ef6ae-f7c3-47b0-b059-ffc8fe64e4fc --type=json \\
  -p '[{"op":"remove","path":"/spec/claimRef/uid"},{"op":"remove","path":"/spec/claimRef/resourceVersion"}]'
k get pv pvc-3d3ef6ae-f7c3-47b0-b059-ffc8fe64e4fc
# pvc-3d3ef6ae-…   1Gi   RWO   Retain   Available   shop/data-postgres-0   local-path   …
k apply -f ~/shop/postgres.yaml
k rollout status sts/postgres
k get pvc data-postgres-0
# data-postgres-0   Bound   pvc-3d3ef6ae-f7c3-47b0-b059-ffc8fe64e4fc   1Gi   RWO   local-path   …
k exec postgres-0 -- psql -U shop -d shop -tAc 'select count(*) from orders'
# 15
\`\`\`

\`Available\` với CLAIM vẫn ghi \`shop/data-postgres-0\`: PV đang hẹn cho đúng tên đó. StatefulSet tạo PVC \`data-postgres-0\` từ template, PV controller bind nó vào PV đã hẹn, postgres khởi động trên thư mục cũ (không initdb lại) và mọi đơn hàng còn đó. Thử ngược thứ tự (apply postgres.yaml trước) thì \`k get pv\` có thêm một PV \`Delete\` mới cho \`data-postgres-0\`, và \`psql\` báo \`ERROR:  relation "orders" does not exist\`.

**5. order: đọc log tới dòng cuối**

Trong lúc chưa có database, cả Pod order mới lẫn catalog đều báo cùng một lỗi:

\`\`\`bash
k logs deploy/order --all-containers --since=10m | grep 'Caused by' | tail -1
# Caused by: java.net.UnknownHostException: postgres-0.postgres.shop.svc.cluster.local
\`\`\`

Sau bước 4, catalog tự hồi (HikariCP mở kết nối mới), còn Pod order mới vẫn CrashLoopBackOff:

\`\`\`bash
k get pod -l app=order
# order-5bd7cf8fc-j4xg2   1/1   Running            2 (24m ago)   81m
# order-6764866d-9c5x5    0/1   CrashLoopBackOff   3 (49s ago)   96s
k logs order-6764866d-9c5x5 --previous | grep 'Caused by' | tail -2
# Caused by: org.postgresql.util.PSQLException: Connection to postgres-0.postgres.shop.svc.cluster.local:5433 refused. Check that the hostname and port are correct and that the postmaster is accepting T…
# Caused by: java.net.ConnectException: Connection refused (connect failed)
grep -A1 DB_URL ~/shop/order.yaml
#         - name: DB_URL
#           value: jdbc:postgresql://postgres-0.postgres.shop.svc.cluster.local:5433/shop
\`\`\`

Tên đúng, tới được Pod, không ai nghe ở 5433: PostgreSQL nghe 5432. Sửa thành \`:5432/shop\` trong \`~/shop/order.yaml\`:

\`\`\`bash
k apply -f ~/shop/order.yaml
k rollout status deploy/order
k get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/products | head -c 60; echo
# [{"id":1,"name":"Bàn phím cơ","price":49.90},{"id":2,"name"
k get pvc
# data-postgres-0   Bound   pvc-3d3ef6ae-f7c3-47b0-b059-ffc8fe64e4fc   1Gi     RWO   local-path   …
# reports           Bound   pvc-0c745895-a850-4dd2-8244-c4989266fa6a   256Mi   RWO   local-path   …
# shop-data         Bound   shop-data                                  1Gi     RWO   manual       …
\`\`\`

Lời giải tự động: \`labs/cka/sessions/s25/apply.sh\` (gây đúng sự cố bằng \`breaks/st4-storage/run.sh\` rồi sửa theo các bước trên; sửa tệp bằng PyYAML thay cho vim).`,
    exam: {
      patterns: [
        "\"PVC X đang Pending, sửa để Pod Y chạy\" — `k describe pvc X`: Event chỉ nguyên nhân; sai lớp thì xoá và tạo lại PVC (giữ YAML bằng `k get pvc X -o yaml > x.yaml`, sửa, bỏ `status`/`uid`).",
        "\"PV Z Released, cho PVC mới W dùng lại dữ liệu\" — gỡ `claimRef` (hay chỉ `uid`), PVC W ghi `volumeName: Z` với cùng lớp, access mode, dung lượng ≤ PV.",
        "\"PVC đứng Terminating\" — `k get pvc -o jsonpath='{.metadata.finalizers}'`: `kubernetes.io/pvc-protection`; tìm Pod đang dùng (`k describe pvc` dòng `Used By`) và xoá nó.",
        "\"Ứng dụng không kết nối được database, tìm lỗi và ghi vào tệp\" — `k logs <pod> --previous` (CrashLoopBackOff) hoặc `--all-containers`, lấy dòng `Caused by` cuối.",
      ],
      timeTargetMin: 20,
      drills: [
        {
          text: "Trong 4 phút: PV `pv-old` (Retain) đang Released, CLAIM `default/data`. Cho PVC mới `data` (default, cùng lớp và dung lượng) bind vào nó mà không xoá PV.",
          timeLimitMin: 4,
          solution: "```bash\nk patch pv pv-old --type=json -p '[{\"op\":\"remove\",\"path\":\"/spec/claimRef/uid\"},{\"op\":\"remove\",\"path\":\"/spec/claimRef/resourceVersion\"}]'\nk get pv pv-old        # Available, CLAIM default/data\nk apply -f data-pvc.yaml\nk get pvc data         # Bound, VOLUME pv-old\n```\nHoặc gỡ cả `claimRef` và ghi `spec.volumeName: pv-old` trong PVC.",
        },
        {
          text: "Trong 2 phút: Pod `api-7d…` CrashLoopBackOff. Ghi dòng `Caused by` cuối của lần chạy trước vào `/tmp/cause.txt`.",
          timeLimitMin: 2,
          solution: "```bash\nk logs api-7d… --previous | grep 'Caused by' | tail -n1 > /tmp/cause.txt\n```\nKhông có `--previous` thì đọc log của lần chạy hiện tại, có thể chưa tới chỗ lỗi.",
        },
      ],
    },
    tips: [
      "`k describe pvc` có dòng `Used By:` liệt kê Pod đang dùng PVC: biết ngay thứ phải xoá trước khi xoá PVC.",
      "Trước khi xoá PVC của dữ liệu quan trọng: `k get pv` xem RECLAIM POLICY. `Delete` thì xoá PVC là xoá dữ liệu.",
      "`k get pv -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,CLAIM:.spec.claimRef.name,UID:.spec.claimRef.uid` cho thấy ngay PV nào còn giữ UID của PVC đã chết.",
      "Lỗi JDBC: đọc dòng `Caused by` **cuối**, các dòng trên chỉ là Spring bọc lại.",
    ],
    outcome: {
      md: `Shop có lại database với đủ dữ liệu cũ, và bạn đã đi đúng quy trình PVC → Events → SC/PV → node → log. Trên Mac:

\`\`\`bash
./labs/lab verify cka s25
\`\`\`

Verify kiểm mọi PVC Bound và không PV Released; \`data-postgres-0\` bind vào đúng PV cũ (PV có trước PVC, không phải PV vừa cấp); đếm bảng bằng \`psql\` và đơn hàng cũ nhất phải có trước PVC hiện tại (dữ liệu của s24, không phải database mới); \`DB_URL\` của catalog và order, PVC và Deployment \`reports\`, hai tệp trong \`~/shop/\` khớp cluster, và đáp án. Giữa buổi verify không chờ: sự cố còn thì đọc ngay.`,
      verifyOutput: "lab: kiểm s25\n  (chờ apiserver, postgres-0 và các Deployment, nếu đang khởi động: tối đa ~7 phút)\n  ✓ Mọi PVC trong shop Bound; không PV nào của shop ở Released\n  ✓ postgres-0 Ready trên cka-w2; PVC data-postgres-0 bind vào PV cũ của s24 (Retain), không phải PV mới\n  ✓ PostgreSQL: products 3 dòng, orders ≥ 3 dòng, đơn cũ của s24 còn (psql trong postgres-0)\n  ✓ catalog, order: DB_URL=jdbc:postgresql://postgres-0.postgres.shop.svc.cluster.local:5432/shop, Available, rollout xong; ~/shop/order.yaml khớp\n  ✓ PVC reports Bound với StorageClass có thật; Deployment reports Available (ghi được /reports); ~/shop/reports.yaml khớp\n  ✓ answers.env: PROTECTION_FINALIZER=kubernetes.io/pvc-protection\n  → 6/6 đạt",
      projectDelta: "Chặng 4 xong (mốc `st4-done`): PostgreSQL giữ dữ liệu qua restart và qua một lần PVC bị xoá; bạn biết vì sao lưu trữ cục bộ ghim Pod vào node. Chặng 5 mở mạng: Service, DNS, Ingress, Gateway API, NetworkPolicy.",
    },
    review: [
      { q: "PVC `reports` Pending, Event `storageclass.storage.k8s.io \"fast-ssd\" not found`. Tạo StorageClass `fast-ssd` có đúng không?", a: "Không nên: lỗi là ứng dụng ghi sai tên lớp. Sửa `storageClassName` về lớp có thật; vì trường này không sửa được trên PVC nên xoá PVC (sau khi xoá Pod dùng nó) và tạo lại." },
      { q: "PV Retain Released, CLAIM `shop/data-postgres-0`. Tạo lại PVC cùng tên, vì sao vẫn không bind?", a: "`claimRef` còn giữ UID của PVC đã xoá; PVC mới có UID khác. Xoá `claimRef.uid` (và `resourceVersion`) để PV giữ chỗ theo tên, hoặc gỡ hẳn `claimRef` rồi tạo PVC ghi `volumeName`." },
      { q: "Vì sao gỡ hẳn `claimRef` có thể làm mất PV vào tay PVC khác?", a: "PV thành `Available` không hẹn ai: PV controller (hay scheduler với WaitForFirstConsumer) có thể ghép nó với bất kỳ PVC nào cùng lớp, access mode, xin ≤ dung lượng, ví dụ PVC `reports` 256Mi." },
      { q: "`k delete pvc data-postgres-0` treo ở Terminating. Vì sao, và có nên xoá finalizer bằng tay?", a: "Finalizer `kubernetes.io/pvc-protection`: PVC còn được Pod `postgres-0` dùng. Xoá StatefulSet (hoặc Pod) trước. Gỡ finalizer bằng tay là để database mất volume khi đang ghi." },
      { q: "order mới CrashLoopBackOff, `k logs` chỉ có vài dòng khởi động. Lấy lỗi thế nào, và `Connection … refused` khác `UnknownHostException` ra sao?", a: "`k logs <pod> --previous` đọc lần chạy đã chết. `UnknownHostException`: tên không phân giải (sai tên, hoặc Pod database chưa Ready/không có). `Connection refused`: tên đúng, tới được Pod, nhưng không ai nghe ở cổng đó (sai cổng)." },
    ],
  },
];
