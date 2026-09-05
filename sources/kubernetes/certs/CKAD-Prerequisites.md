# 🧱 CKAD Prerequisites — Kiến Thức Nền Tảng Chi Tiết

> Tài liệu bổ trợ cho **CKAD-Study-Guide.md**, đi sâu vào 4 nhóm kiến thức tiên quyết: **Linux & Command Line**, **vim**, **Container & Docker**, **YAML** — kèm phần networking cơ bản. Học kỹ phần này trước khi bắt đầu Tuần 1 của lộ trình. Thời gian dự kiến: **1–2 tuần** (nếu bạn hoàn toàn mới).

---

## Mục Lục
1. [Linux & Command Line](#phần-1-linux--command-line)
2. [Vim — Editor Bắt Buộc Trong Phòng Thi](#phần-2-vim--editor-bắt-buộc-trong-phòng-thi)
3. [Container & Docker](#phần-3-container--docker)
4. [YAML](#phần-4-yaml)
5. [Networking Cơ Bản](#phần-5-networking-cơ-bản)
6. [Bài Kiểm Tra Tự Đánh Giá](#phần-6-bài-kiểm-tra-tự-đánh-giá)

---

# PHẦN 1: Linux & Command Line

> **Tại sao quan trọng:** Toàn bộ kỳ thi CKAD diễn ra trên terminal Linux. Bạn sẽ liên tục di chuyển giữa thư mục, đọc/sửa file, lọc output bằng grep, và redirect output vào file YAML.

## 1.1. Cấu trúc hệ thống file Linux

```
/           gốc (root) của toàn bộ hệ thống
/home       thư mục người dùng (/home/user)
/etc        file cấu hình hệ thống
/var        dữ liệu thay đổi (log ở /var/log)
/tmp        file tạm
/usr/bin    chương trình thực thi
/mnt        điểm mount
```

Khái niệm đường dẫn:
```bash
/home/user/file.txt     # đường dẫn tuyệt đối (bắt đầu bằng /)
./file.txt              # đường dẫn tương đối (. = thư mục hiện tại)
../file.txt             # .. = thư mục cha
~/file.txt              # ~ = thư mục home của user hiện tại
```

## 1.2. Di chuyển & thao tác file

```bash
pwd                         # đang ở đâu
ls                          # liệt kê
ls -la                      # chi tiết + file ẩn (bắt đầu bằng .)
ls -lh                      # kích thước dễ đọc (K, M, G)
cd /path/to/dir             # di chuyển
cd ~                        # về home
cd -                        # quay lại thư mục trước đó

mkdir mydir                 # tạo thư mục
mkdir -p a/b/c              # tạo cả cây thư mục lồng nhau
touch file.txt              # tạo file rỗng
cp file.txt backup.txt      # copy
cp -r dir1 dir2             # copy cả thư mục
mv old.txt new.txt          # di chuyển / đổi tên
rm file.txt                 # xóa file
rm -rf mydir                # xóa thư mục (CẨN THẬN — không hoàn tác được)
```

## 1.3. Đọc nội dung file

```bash
cat file.txt                # in toàn bộ
cat -n file.txt             # kèm số dòng
less file.txt               # xem theo trang (q để thoát, / để tìm)
head -20 file.txt           # 20 dòng đầu
tail -20 file.txt           # 20 dòng cuối
tail -f app.log             # theo dõi log realtime (Ctrl+C thoát)
wc -l file.txt              # đếm số dòng
```

## 1.4. Pipes, Redirect & Grep — ⭐ quan trọng nhất cho CKAD

### Redirect (chuyển output)
```bash
command > file.txt          # ghi output vào file (GHI ĐÈ)
command >> file.txt         # nối vào cuối file
command 2> error.log        # chỉ ghi lỗi (stderr)
command &> all.log          # ghi cả output lẫn lỗi
command < input.txt         # đọc input từ file
```

**Ứng dụng trực tiếp trong CKAD:**
```bash
kubectl run nginx --image=nginx --dry-run=client -o yaml > pod.yaml
kubectl get pod nginx -o yaml > backup.yaml
```

### Pipe (nối lệnh)
```bash
command1 | command2         # output của lệnh 1 làm input lệnh 2

kubectl get pods | grep nginx
kubectl get pods -A | wc -l
kubectl describe pod nginx | less
```

### Grep (lọc text)
```bash
grep "error" app.log            # tìm dòng chứa "error"
grep -i "error" app.log         # không phân biệt hoa thường
grep -v "info" app.log          # loại trừ dòng chứa "info"
grep -r "TODO" ./src            # tìm đệ quy trong thư mục
grep -A 5 "Events" out.txt      # in kèm 5 dòng SAU dòng khớp
grep -B 3 "error" app.log       # in kèm 3 dòng TRƯỚC
grep -c "error" app.log         # đếm số dòng khớp
grep -n "error" app.log         # kèm số dòng

# Ứng dụng CKAD:
kubectl describe pod nginx | grep -A 10 Events
kubectl get pods -A | grep -v Running     # tìm pod KHÔNG Running
```

### Heredoc — tạo file nhanh không cần editor
```bash
cat <<EOF > pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
  - name: nginx
    image: nginx
EOF
```

## 1.5. Tìm kiếm file & lệnh

```bash
find / -name "*.yaml" 2>/dev/null     # tìm file theo tên (2>/dev/null ẩn lỗi permission)
find . -type d -name "config"         # tìm thư mục
which kubectl                         # đường dẫn của lệnh
history                               # lịch sử lệnh
!!                                    # chạy lại lệnh cuối
!123                                  # chạy lại lệnh số 123 trong history
Ctrl+R                                # tìm ngược trong history (gõ từ khóa)
```

## 1.6. Biến môi trường

```bash
echo $HOME                      # in giá trị biến
export MY_VAR="hello"           # tạo biến (có hiệu lực với process con)
env                             # liệt kê tất cả biến
echo $PATH                      # danh sách thư mục chứa lệnh
unset MY_VAR                    # xóa biến

# Ứng dụng CKAD — alias/biến dùng suốt kỳ thi:
alias k=kubectl
export do="--dry-run=client -o yaml"
```

Lưu vĩnh viễn: thêm vào `~/.bashrc` rồi chạy `source ~/.bashrc`.

## 1.7. Quyền file (Permissions)

```
-rwxr-xr--  1 user group 1234 Jan 1 file.sh
 │││ │  └── others: r-- (chỉ đọc)
 │││ └───── group:  r-x (đọc + thực thi)
 ││└─────── owner:  rwx (đọc + ghi + thực thi)
 
r=4, w=2, x=1  →  rwx=7, r-x=5, r--=4
```

```bash
chmod +x script.sh          # thêm quyền thực thi
chmod 755 script.sh         # rwxr-xr-x
chmod 600 secret.key        # rw------- (chỉ owner đọc/ghi)
chown user:group file.txt   # đổi chủ sở hữu
```

## 1.8. Process & System

```bash
ps aux                      # liệt kê process
ps aux | grep nginx
top                         # monitor realtime (q thoát)
kill <PID>                  # dừng process
kill -9 <PID>               # buộc dừng
df -h                       # dung lượng ổ đĩa
free -h                     # RAM
curl http://localhost:8080          # gọi HTTP (rất hay dùng test service)
curl -s http://svc | head           # -s: silent
wget -qO- http://svc                # tương tự curl, có sẵn trong busybox
sleep 3600                          # chờ N giây (dùng trong command của pod)
watch kubectl get pods              # chạy lặp lệnh mỗi 2s
```

## 1.9. Bài tập thực hành Linux

1. Tạo cây thư mục `~/lab/manifests/{pods,deployments,services}` bằng 1 lệnh duy nhất.
2. Tạo file `pod.yaml` bằng heredoc, copy sang `deployments/`, đổi tên thành `deploy.yaml`.
3. Dùng `grep` lọc mọi dòng chứa `image:` trong tất cả file `.yaml` trong `~/lab`.
4. Redirect output của `ls -la /etc` vào file, đếm số dòng của file đó.
5. Tạo biến `export ns=dev` và dùng nó trong lệnh: `echo "namespace: $ns"`.

---

# PHẦN 2: Vim — Editor Bắt Buộc Trong Phòng Thi

> **Tại sao quan trọng:** Trong phòng thi, bạn sửa YAML bằng vim (hoặc nano). Người thi trượt CKAD vì vim nhiều hơn bạn nghĩ — thao tác chậm hoặc phá hỏng indent. Mục tiêu: sửa file YAML **tự tin, không do dự**.

## 2.1. Ba chế độ của vim

```
NORMAL mode   (mặc định)  → di chuyển, xóa, copy/paste, lệnh
INSERT mode   (gõ chữ)    → vào bằng i/a/o, thoát bằng Esc
COMMAND mode  (lệnh :)    → lưu, thoát, tìm kiếm, thay thế
```

**Quy tắc sống còn:** Bối rối? Nhấn `Esc` vài lần để chắc chắn đang ở NORMAL mode.

## 2.2. Lệnh tối thiểu phải thuộc lòng

### Mở / lưu / thoát
```
vim file.yaml       mở file
:w                  lưu
:q                  thoát
:wq  (hoặc ZZ)      lưu + thoát
:q!                 thoát KHÔNG lưu (cứu cánh khi lỡ tay phá file)
```

### Vào Insert mode
```
i       chèn TRƯỚC con trỏ
a       chèn SAU con trỏ
o       tạo dòng mới BÊN DƯỚI rồi insert   ← dùng nhiều nhất khi viết YAML
O       tạo dòng mới BÊN TRÊN rồi insert
Esc     quay về Normal mode
```

### Di chuyển (Normal mode)
```
h j k l         trái / xuống / lên / phải (hoặc dùng phím mũi tên)
w  /  b         nhảy tới đầu từ tiếp theo / lùi lại
0  /  $         đầu dòng / cuối dòng
gg /  G         đầu file / cuối file
:15             nhảy tới dòng 15
Ctrl+d / Ctrl+u nửa trang xuống / lên
```

### Xóa / Copy / Paste — ⭐ quyết định tốc độ làm bài
```
x           xóa 1 ký tự
dd          xóa (cắt) 1 dòng
5dd         xóa 5 dòng
dw          xóa 1 từ
D           xóa từ con trỏ tới cuối dòng
yy          copy 1 dòng
5yy         copy 5 dòng
p           paste BÊN DƯỚI con trỏ
P           paste BÊN TRÊN
u           undo  ← thuộc lòng!
Ctrl+r      redo
.           lặp lại thao tác vừa làm
```

### Tìm kiếm & thay thế
```
/image          tìm "image" (n = kết quả tiếp, N = kết quả trước)
:%s/old/new/g   thay thế old → new TOÀN FILE
:%s/old/new/gc  thay thế có xác nhận từng chỗ
:noh            tắt highlight sau tìm kiếm
```

### Thao tác khối (Visual mode) — cứu tinh khi sửa indent YAML
```
v           chọn theo ký tự
V           chọn theo DÒNG  ← hay dùng nhất
Ctrl+v      chọn theo khối cột
(sau khi chọn:)
d           xóa vùng chọn
y           copy vùng chọn
>           indent vùng chọn sang PHẢI (thêm 1 mức)
<           indent sang TRÁI
```

**Workflow copy block YAML kinh điển trong đề thi:**
```
1. Đưa con trỏ tới dòng đầu block container
2. V         (Visual line)
3. j j j     (mở rộng xuống hết block)
4. y         (copy)
5. Di chuyển tới vị trí đích
6. p         (paste)
7. Chọn lại block vừa paste bằng V + j, nhấn > hoặc < để chỉnh indent
```

## 2.3. Cấu hình ~/.vimrc cho YAML (làm ngay đầu giờ thi)

```vim
set tabstop=2        " tab hiển thị = 2 spaces
set expandtab        " nhấn Tab → chèn spaces (YAML KHÔNG chấp nhận tab!)
set shiftwidth=2     " indent bằng >/< = 2 spaces
set number           " hiện số dòng (tùy chọn)
```

Hoặc gõ trực tiếp trong vim: `:set tabstop=2 expandtab shiftwidth=2`

## 2.4. Bẫy vim thường gặp

| Tình huống | Xử lý |
|---|---|
| Gõ chữ mà ra lệnh lung tung | Đang ở Normal mode → nhấn `i` |
| Nhấn `:` mà không thấy gì | Đang ở Insert mode → `Esc` trước |
| Paste từ clipboard bị lệch indent | `:set paste` trước khi paste, `:set nopaste` sau |
| Lỡ phá nát file | `u` nhiều lần, hoặc `:q!` thoát không lưu |
| File "readonly" | `:w !sudo tee %` hoặc thoát mở lại đúng quyền |

## 2.5. Bài tập vim (làm mỗi ngày 10 phút trong 1 tuần)

1. Mở 1 file YAML pod, copy block `containers` và paste thành container thứ 2, sửa name.
2. Dùng `:%s/nginx/httpd/g` đổi toàn bộ image.
3. Chọn 5 dòng bằng `V`, indent sang phải 1 mức bằng `>`.
4. Xóa 3 dòng giữa file bằng `3dd`, undo bằng `u`, redo bằng `Ctrl+r`.
5. Luyện tại **vimtutor** (gõ `vimtutor` trong terminal) — bài 1–4 là đủ cho CKAD.

---

# PHẦN 3: Container & Docker

> **Tại sao quan trọng:** Kubernetes là hệ thống điều phối (orchestration) container. Không hiểu container = không hiểu Kubernetes. Ngoài ra, curriculum CKAD có riêng mục **build container image**.

## 3.1. Container là gì?

**Định nghĩa:** Container là một process được cô lập, đóng gói kèm toàn bộ dependencies (code, runtime, thư viện, config) để chạy đồng nhất trên mọi môi trường.

### Container vs Virtual Machine

| | Container | Virtual Machine |
|---|---|---|
| Ảo hóa | Mức OS (chia sẻ kernel host) | Mức phần cứng (mỗi VM có OS riêng) |
| Kích thước | MB | GB |
| Khởi động | Giây | Phút |
| Cô lập | Process-level (namespaces, cgroups) | Hoàn toàn (hypervisor) |
| Mật độ | Hàng trăm/host | Hàng chục/host |

### Khái niệm cốt lõi
- **Image**: bản mẫu chỉ-đọc (read-only), gồm nhiều **layer** xếp chồng. Giống "class".
- **Container**: instance đang chạy của image (image + 1 layer ghi được). Giống "object".
- **Registry**: kho lưu image (Docker Hub, ghcr.io, private registry).
- **Tag**: nhãn phiên bản của image (`nginx:1.25`, `nginx:latest`). ⚠️ `latest` không có nghĩa là "mới nhất" — chỉ là tag mặc định.

## 3.2. Cài đặt & lệnh Docker cơ bản

```bash
# Kiểm tra
docker version
docker info

# Vòng đời container
docker run nginx                          # chạy (foreground)
docker run -d nginx                       # chạy nền (detached)
docker run -d --name web nginx            # đặt tên
docker run -d -p 8080:80 nginx            # map port host:container
docker run -d -e MY_VAR=hello nginx       # biến môi trường
docker run -it ubuntu bash                # chạy tương tác + vào shell
docker run --rm -it busybox sh            # tự xóa sau khi thoát

docker ps                                 # container đang chạy
docker ps -a                              # tất cả (kể cả đã dừng)
docker stop web
docker start web
docker restart web
docker rm web                             # xóa container (phải stop trước, hoặc -f)
docker rm -f $(docker ps -aq)             # xóa TẤT CẢ container

# Quan sát & debug
docker logs web
docker logs -f web                        # theo dõi realtime
docker exec -it web sh                    # vào shell container đang chạy
docker inspect web                        # chi tiết JSON
docker stats                              # CPU/RAM realtime

# Image
docker images
docker pull nginx:1.25
docker rmi nginx:1.25                     # xóa image
docker tag myapp:v1 registry.io/myapp:v1
docker push registry.io/myapp:v1
docker save myapp:v1 -o myapp.tar         # export ra file ⭐ hay ra thi CKAD
docker load -i myapp.tar                  # import từ file
```

> 💡 **Podman**: một số môi trường thi dùng `podman` thay `docker` — cú pháp giống hệt nhau, chỉ đổi tên lệnh.

## 3.3. Dockerfile — build image của riêng bạn

### Các chỉ thị (instructions) quan trọng

```dockerfile
FROM nginx:1.25              # image nền (base image) — luôn ở dòng đầu
WORKDIR /app                 # đặt thư mục làm việc (tự tạo nếu chưa có)
COPY src/ /app/              # copy file từ build context vào image
ADD app.tar.gz /app/         # như COPY nhưng tự giải nén tar (ưu tiên dùng COPY)
RUN apt-get update && \
    apt-get install -y curl  # chạy lệnh KHI BUILD (mỗi RUN = 1 layer)
ENV APP_ENV=production       # biến môi trường trong container
EXPOSE 80                    # khai báo port (chỉ mang tính tài liệu)
USER 1000                    # chạy container bằng user này (security!)
ENTRYPOINT ["python"]        # lệnh CHÍNH khi container chạy
CMD ["app.py"]               # tham số MẶC ĐỊNH (có thể override khi run)
```

### ENTRYPOINT vs CMD — ⭐ liên hệ trực tiếp tới K8s

```dockerfile
ENTRYPOINT ["python"]     # cố định — docker run <img> abc → chạy "python abc"
CMD ["app.py"]            # mặc định — docker run <img>     → chạy "python app.py"
```

**Ánh xạ sang Kubernetes (cực kỳ quan trọng cho CKAD):**

| Dockerfile | Pod spec | Ý nghĩa |
|---|---|---|
| `ENTRYPOINT` | `command` | Lệnh chính |
| `CMD` | `args` | Tham số |

```yaml
# K8s override cả hai:
containers:
- name: app
  image: myapp
  command: ["python"]        # thay ENTRYPOINT
  args: ["other.py", "-v"]   # thay CMD
```

### Build image
```bash
docker build -t myapp:v1 .            # . = build context (thư mục hiện tại)
docker build -t myapp:v1 -f custom.Dockerfile .
docker history myapp:v1               # xem các layer
```

### Ví dụ Dockerfile hoàn chỉnh (Python app)
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
USER 1000
ENTRYPOINT ["python"]
CMD ["main.py"]
```

### Best practices (được hỏi gián tiếp trong thi & phỏng vấn)
- Dùng base image nhỏ (`-slim`, `-alpine`) → image nhẹ, ít lỗ hổng bảo mật.
- Tận dụng **layer cache**: copy `requirements.txt` + install TRƯỚC khi copy source code.
- Mỗi container **1 process chính** — đây chính là lý do K8s có multi-container pod.
- Không chạy bằng root (`USER`), không nhúng secret vào image.
- Dùng `.dockerignore` loại file thừa khỏi build context.

## 3.4. Docker volumes & networks (mức nhận biết)

```bash
docker run -d -v mydata:/var/lib/mysql mysql        # named volume
docker run -d -v $(pwd)/html:/usr/share/nginx/html nginx   # bind mount
docker volume ls
docker network ls
docker network create mynet
docker run -d --network mynet --name db postgres    # container cùng network gọi nhau bằng tên
```

> Khái niệm này ánh xạ sang K8s: volume → Volume/PV/PVC; network → mọi Pod chung một mạng phẳng.

## 3.5. Bài tập thực hành Docker

1. Chạy `nginx` map port 8080, kiểm tra bằng `curl localhost:8080`, xem logs, exec vào sửa `index.html`, xóa container.
2. Viết Dockerfile cho 1 script Python in "Hello CKAD", build tag `hello:v1`, chạy thử.
3. Build cùng image trên nhưng override CMD khi run: `docker run hello:v1 python -c "print('override')"`.
4. `docker save` image ra file `.tar`, xóa image, `docker load` lại.
5. Chạy busybox với `--rm -it`, thử `wget -qO- google.com` bên trong.

---

# PHẦN 4: YAML

> **Tại sao quan trọng:** Mọi tài nguyên Kubernetes được định nghĩa bằng YAML. 90% lỗi YAML của người mới là **sai indentation**. Đề thi không tha thứ cho lỗi cú pháp.

## 4.1. Quy tắc vàng

1. **Indent bằng SPACES, tuyệt đối KHÔNG dùng TAB** (chuẩn K8s: 2 spaces/mức).
2. Cùng cấp = cùng mức indent.
3. Phân biệt hoa/thường (`Name` ≠ `name`).
4. `key: value` — **phải có space sau dấu hai chấm**.

## 4.2. Kiểu dữ liệu

### Scalar (giá trị đơn)
```yaml
name: nginx                  # string
name: "nginx"                # string (nháy khi có ký tự đặc biệt : { } [ ] , & * # ? | - < > = ! % @ \)
replicas: 3                  # number
enabled: true                # boolean (true/false)
value: null                  # null (hoặc ~)
version: "1.25"              # ⚠️ nháy để giữ string — không nháy sẽ thành number 1.25
port: "8080"                 # env values trong K8s PHẢI là string → luôn nháy số
```

### Mapping (object / dictionary)
```yaml
metadata:
  name: nginx
  namespace: dev
  labels:
    app: web
    tier: frontend
```

### List (mảng) — mỗi phần tử bắt đầu bằng `- `
```yaml
# List các giá trị đơn:
args:
- "-c"
- "sleep 3600"

# List các object (dấu - đánh dấu MỖI phần tử mới):
containers:
- name: app            # ← phần tử 1 (object có 2 key)
  image: nginx
- name: sidecar        # ← phần tử 2
  image: busybox

# Inline (viết gọn):
accessModes: ["ReadWriteOnce"]
command: ["sh", "-c", "echo hi"]
```

> 📌 **Cách đọc list of objects:** dấu `-` bắt đầu 1 phần tử mới; các dòng sau **thẳng hàng với ký tự đầu tiên sau `- `** thì thuộc cùng phần tử đó.

### Multi-line string
```yaml
# | (literal) — GIỮ nguyên xuống dòng — hay dùng cho script/config file:
script: |
  #!/bin/sh
  echo "line 1"
  echo "line 2"

# > (folded) — GỘP thành 1 dòng:
description: >
  Đây là mô tả dài
  sẽ được nối thành một dòng.
```

**Ứng dụng CKAD — nhúng file config vào ConfigMap:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-conf
data:
  nginx.conf: |
    server {
      listen 80;
      location / {
        root /usr/share/nginx/html;
      }
    }
```

## 4.3. Nhiều document trong 1 file

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod1
spec:
  containers:
  - name: nginx
    image: nginx
---                        # dấu phân cách document
apiVersion: v1
kind: Service
metadata:
  name: svc1
spec:
  selector:
    app: web
  ports:
  - port: 80
```
→ `kubectl apply -f file.yaml` tạo cả hai.

## 4.4. Comment & Anchor

```yaml
# Đây là comment
replicas: 3   # comment cuối dòng

# Anchor & alias (ít gặp trong K8s, nhận biết là đủ):
defaults: &defaults
  cpu: 100m
container1:
  <<: *defaults
```

## 4.5. Giải phẫu 1 manifest Kubernetes

Mọi resource K8s có 4 field gốc:

```yaml
apiVersion: apps/v1        # 1. Phiên bản API của resource
kind: Deployment           # 2. Loại resource
metadata:                  # 3. Định danh: name, namespace, labels, annotations
  name: web
  labels:
    app: web
spec:                      # 4. Trạng thái MONG MUỐN (mỗi kind có spec riêng)
  replicas: 3
  ...
# status:                  # (K8s tự sinh — trạng thái THỰC TẾ, không tự viết)
```

Không nhớ field nào nằm đâu? → `kubectl explain deployment.spec --recursive`

## 4.6. Lỗi YAML kinh điển & cách nhận diện

```yaml
# ❌ Sai indent — image không thẳng hàng với name:
containers:
- name: app
    image: nginx           # LỖI: thừa 2 spaces

# ✅ Đúng:
containers:
- name: app
  image: nginx

# ❌ Thiếu space sau dấu hai chấm:
name:nginx                 # LỖI

# ❌ Dùng tab thay space → "found character that cannot start any token"

# ❌ Quên dấu - cho phần tử list:
containers:
  name: app                # LỖI: containers là list, phải có -

# ❌ Số trong env không nháy:
env:
- name: PORT
  value: 8080              # LỖI K8s: env value phải là string
# ✅ value: "8080"
```

**Công cụ kiểm tra:**
```bash
kubectl apply -f pod.yaml --dry-run=client     # validate không tạo thật
kubectl apply -f pod.yaml --dry-run=server     # validate qua API server (chặt hơn)
python3 -c "import yaml,sys; yaml.safe_load(open('pod.yaml'))"   # check cú pháp thuần
```

## 4.7. Bài tập YAML

1. Viết tay (không copy) YAML cho 1 Pod có 2 containers, mỗi container có env và resources.
2. Cố tình tạo 5 lỗi indent khác nhau, chạy `--dry-run=client` và đọc hiểu từng thông báo lỗi.
3. Viết ConfigMap chứa 1 file config multi-line bằng `|`.
4. Viết 1 file chứa 3 documents (Pod + ConfigMap + Service) ngăn bằng `---`.
5. Dùng `kubectl explain pod.spec.containers.resources --recursive` và tự viết block resources từ output đó.

---

# PHẦN 5: Networking Cơ Bản

> **Tại sao quan trọng:** Domain "Services and Networking" chiếm 20% đề thi. Không cần sâu như network engineer, nhưng phải nắm các khái niệm sau.

## 5.1. IP & Port

- **IP address**: định danh máy/pod trong mạng (`192.168.1.10`). Trong K8s, **mỗi Pod có 1 IP riêng**.
- **Port**: định danh dịch vụ trên 1 IP (0–65535). Ports quen thuộc:

| Port | Dịch vụ |
|---|---|
| 80 | HTTP |
| 443 | HTTPS |
| 53 | DNS |
| 3306 | MySQL |
| 5432 | PostgreSQL |
| 6379 | Redis |
| 8080 | HTTP thay thế |

- **CIDR notation**: `10.0.0.0/16` = dải IP từ 10.0.0.0 đến 10.0.255.255 (/16 = 65536 địa chỉ; /24 = 256 địa chỉ). → Dùng trong NetworkPolicy `ipBlock`.

## 5.2. DNS

- DNS dịch **tên** → **IP** (`google.com` → `142.250.x.x`).
- Trong K8s, DNS nội bộ (CoreDNS) dịch **tên Service** → **ClusterIP**:
  ```
  <service-name>.<namespace>.svc.cluster.local
  ```
- Lệnh kiểm tra:
  ```bash
  nslookup my-service          # tra DNS
  nslookup my-service.dev      # service ở namespace khác
  ```

## 5.3. HTTP cơ bản

- **Methods**: GET (đọc), POST (tạo), PUT/PATCH (sửa), DELETE (xóa) — kubectl thực chất gọi REST API của K8s bằng các method này.
- **Status codes**:
  - `2xx` thành công (200 OK) — probe httpGet coi 200–399 là pass
  - `3xx` redirect
  - `4xx` lỗi client (404 Not Found, 403 Forbidden — hay gặp khi RBAC thiếu quyền)
  - `5xx` lỗi server (503 Service Unavailable — service không có endpoint)
- **Test bằng curl/wget:**
  ```bash
  curl -s http://web-svc
  curl -o /dev/null -s -w "%{http_code}" http://web-svc   # chỉ in status code
  wget -qO- --timeout=2 http://web-svc                    # busybox không có curl → dùng wget
  ```

## 5.4. TCP vs UDP (mức nhận biết)

| | TCP | UDP |
|---|---|---|
| Kết nối | Có bắt tay, tin cậy | Không, nhanh |
| Dùng cho | HTTP, database | DNS (port 53), streaming |
| Trong K8s | Mặc định của Service/NetworkPolicy | Nhớ mở UDP 53 cho DNS trong egress NetworkPolicy |

---

# PHẦN 6: Bài Kiểm Tra Tự Đánh Giá

> Trả lời được **hết** các câu dưới đây (bằng cách thực hành, không chỉ lý thuyết) = bạn sẵn sàng bắt đầu Tuần 1 của lộ trình CKAD.

### Linux (10 câu)
- [ ] Tạo cây thư mục 3 cấp bằng 1 lệnh?
- [ ] Khác nhau giữa `>` và `>>`?
- [ ] Lọc các dòng KHÔNG chứa "Running" từ output của một lệnh?
- [ ] In 10 dòng sau dòng chứa "Events" trong 1 file?
- [ ] Tạo file YAML bằng heredoc?
- [ ] Tạo alias và biến môi trường, lưu vĩnh viễn vào ~/.bashrc?
- [ ] Ý nghĩa của `chmod 600`?
- [ ] Theo dõi log realtime của 1 file?
- [ ] Tìm lại lệnh đã gõ 20 phút trước bằng Ctrl+R?
- [ ] Ý nghĩa `2>/dev/null`?

### Vim (8 câu)
- [ ] Chuyển qua lại 3 modes không do dự?
- [ ] Copy 5 dòng và paste sang chỗ khác?
- [ ] Xóa 1 dòng, undo, redo?
- [ ] Thay thế toàn bộ "nginx" thành "httpd" trong file?
- [ ] Chọn 1 block bằng Visual line và indent sang phải?
- [ ] Nhảy tới dòng 42? Tới cuối file?
- [ ] Thoát không lưu khi lỡ phá file?
- [ ] Cấu hình vim dùng 2-space thay tab?

### Docker (8 câu)
- [ ] Giải thích image vs container vs registry?
- [ ] Chạy container nền, map port, đặt tên, set env — trong 1 lệnh?
- [ ] Xem logs và exec vào shell của container đang chạy?
- [ ] Viết Dockerfile ~6 dòng cho 1 app đơn giản và build nó?
- [ ] Phân biệt ENTRYPOINT vs CMD, và chúng ánh xạ sang field nào trong Pod spec?
- [ ] Phân biệt COPY vs ADD? RUN vs CMD?
- [ ] Save image ra file .tar và load lại?
- [ ] Tại sao không nên chạy container bằng root?

### YAML (6 câu)
- [ ] Viết list of objects (containers có 2 phần tử) đúng indent, không nhìn mẫu?
- [ ] Khi nào cần nháy kép cho giá trị?
- [ ] Khác nhau giữa `|` và `>`?
- [ ] 4 field gốc của mọi manifest K8s?
- [ ] Tách nhiều resource trong 1 file bằng gì?
- [ ] Validate YAML mà không tạo resource thật?

### Networking (4 câu)
- [ ] Port mặc định của HTTP, HTTPS, DNS?
- [ ] `10.0.0.0/24` gồm bao nhiêu địa chỉ?
- [ ] Ý nghĩa status code 403 và 503?
- [ ] Test 1 HTTP endpoint bằng cả curl và wget?

---

## 📎 Tài Nguyên Học Prerequisites

| Chủ đề | Tài nguyên |
|---|---|
| Linux | *Linux Journey* (linuxjourney.com) — miễn phí, cho người mới |
| Vim | Gõ `vimtutor` trong terminal (bài 1–4), hoặc *OpenVim* (openvim.com) |
| Docker | *Docker Getting Started* (docs.docker.com/get-started) + Play with Docker (labs.play-with-docker.com) |
| YAML | *Learn YAML in Y minutes* (learnxinyminutes.com/docs/yaml) |
| Tất cả | Khóa *Docker for the Absolute Beginner* — KodeKloud (cùng tác giả khóa CKAD) |

---

*Hoàn thành tài liệu này → quay lại **CKAD-Study-Guide.md** bắt đầu Tuần 1. Chúc bạn học tốt! 💪*
