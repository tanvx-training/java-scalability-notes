// Chặng 4 — Storage: PostgreSQL bền vững.
// s22–s23 đã phát hành; s24–s25 là buổi khung (đủ trường cấu trúc, check-data PR7).

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

  {
    id: "s24",
    stage: "st4",
    title: "StatefulSet cho PostgreSQL và nối shop vào database",
    durationMin: 90,
    domain: "storage",
    competencies: ["st-pv-pvc"],
    requires: ["s23"],
    status: "skeleton",
    pieces: ["postgres"],
    goals: [
      "Chạy PostgreSQL bằng StatefulSet + headless Service + volumeClaimTemplates trên node dành cho db.",
      "Nối catalog và order vào postgres-0 qua tên DNS ổn định và Secret db-cred (HikariCP).",
      "Chứng minh dữ liệu còn nguyên sau khi xoá Pod postgres-0 và sau khi dời nó sang node khác.",
    ],
    skills: [
      { skill: "k-statefulset-yaml", level: "Viết được có tra" },
      { skill: "k-headless-svc", level: "Viết được không tra" },
      { skill: "k-sts-dns", level: "Giải thích được" },
      { skill: "k-sts-ordering", level: "Giải thích được" },
      { skill: "k-exec-psql", level: "Gõ được không tra" },
    ],
    uses: ["k-secret-env-volume", "k-nodeselector-toleration", "k-default-sc", "k-rollout-restart", "k-probes-yaml"],
    stateIn: "Đầu ra s23: có StorageClass mặc định; catalog và order chưa có database thật.",
    stateOut: "StatefulSet postgres 1 replica với PVC data-postgres-0; catalog đọc sản phẩm, order ghi đơn hàng vào PostgreSQL.",
  },
  {
    id: "s25",
    stage: "st4",
    title: "Sự cố chặng 4: PVC Pending và dữ liệu biến mất",
    durationMin: 75,
    domain: "troubleshooting",
    competencies: ["ts-logs"],
    requires: ["s24"],
    status: "skeleton",
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
    uses: ["k-describe-pvc", "k-get-sc", "k-reclaim-policy", "k-logs-previous", "k-exec-psql"],
    stateIn: "Đầu ra s24 cộng `./labs/lab break`: PVC mới Pending, order mất kết nối database.",
    stateOut: "Mọi PVC Bound, PostgreSQL giữ đủ dữ liệu như cuối s24, catalog và order đọc ghi bình thường.",
  },
];
