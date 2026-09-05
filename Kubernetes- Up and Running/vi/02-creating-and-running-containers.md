# Chương 2. Tạo và chạy Container

Kubernetes là một nền tảng để tạo, triển khai và quản lý các ứng dụng phân tán. Những ứng dụng này có nhiều hình dạng và kích cỡ khác nhau, nhưng cuối cùng, tất cả đều được cấu thành từ một hoặc nhiều chương trình chạy trên các máy riêng lẻ. Các chương trình này nhận đầu vào, xử lý dữ liệu và trả về kết quả. Trước khi có thể nghĩ đến việc xây dựng một hệ thống phân tán, chúng ta phải xem xét cách xây dựng các container image ứng dụng chứa những chương trình này và tạo nên các mảnh ghép của hệ thống phân tán.

Các chương trình ứng dụng thường được cấu thành từ một language runtime, các thư viện và mã nguồn của bạn. Trong nhiều trường hợp, ứng dụng của bạn phụ thuộc vào các thư viện dùng chung bên ngoài như `libc` và `libssl`. Những thư viện bên ngoài này thường được phân phối dưới dạng các thành phần dùng chung trong OS mà bạn đã cài đặt trên một máy cụ thể.

Sự phụ thuộc vào các thư viện dùng chung này gây ra vấn đề khi một ứng dụng được phát triển trên laptop của lập trình viên phụ thuộc vào một thư viện dùng chung không có sẵn khi chương trình được đưa lên OS production. Ngay cả khi môi trường phát triển và production dùng chung chính xác cùng một phiên bản OS, vấn đề vẫn có thể xảy ra khi các nhà phát triển quên đưa các file tài nguyên phụ thuộc vào trong gói mà họ triển khai lên production.

Các phương pháp truyền thống để chạy nhiều chương trình trên một máy đòi hỏi tất cả các chương trình này phải dùng chung cùng phiên bản của các thư viện dùng chung trên hệ thống. Nếu các chương trình khác nhau được phát triển bởi các đội hoặc tổ chức khác nhau, những phụ thuộc dùng chung này thêm vào sự phức tạp và ràng buộc không cần thiết giữa các đội.

Một chương trình chỉ có thể thực thi thành công nếu nó có thể được triển khai một cách đáng tin cậy lên máy mà nó cần chạy. Quá thường xuyên, phương pháp tiên tiến nhất cho việc triển khai lại là chạy các script mệnh lệnh, vốn không thể tránh khỏi những trường hợp lỗi ngoằn ngoèo và rối rắm. Điều này khiến việc phát hành phiên bản mới của toàn bộ hoặc một phần của hệ thống phân tán trở thành một nhiệm vụ tốn nhiều công sức và khó khăn.

Trong Chương 1, chúng tôi đã lập luận mạnh mẽ về giá trị của image và hạ tầng bất biến. Tính bất biến này chính là điều mà container image mang lại. Như chúng ta sẽ thấy, nó dễ dàng giải quyết mọi vấn đề về quản lý phụ thuộc và đóng gói vừa mô tả.

Khi làm việc với các ứng dụng, thường hữu ích khi đóng gói chúng theo cách giúp việc chia sẻ với người khác trở nên dễ dàng. Docker, công cụ mặc định mà hầu hết mọi người dùng cho container, giúp dễ dàng đóng gói một file thực thi và đẩy nó lên một registry từ xa, nơi sau đó người khác có thể kéo về. Tại thời điểm viết cuốn sách này, container registry có sẵn trên tất cả các public cloud lớn, và dịch vụ xây dựng image trên cloud cũng có sẵn ở nhiều nơi trong số đó. Bạn cũng có thể chạy registry của riêng mình bằng các hệ thống mã nguồn mở hoặc thương mại. Những registry này giúp người dùng dễ dàng quản lý và triển khai các image riêng tư, trong khi các dịch vụ image-builder cung cấp tích hợp dễ dàng với các hệ thống continuous delivery.

Trong chương này và phần còn lại của cuốn sách, chúng ta sẽ làm việc với một ứng dụng ví dụ đơn giản mà chúng tôi đã xây dựng để giúp minh họa quy trình làm việc này trong thực tế. Bạn có thể tìm thấy ứng dụng trên GitHub.

Container image gói một chương trình và các phụ thuộc của nó thành một artifact duy nhất dưới một root filesystem. Định dạng container image phổ biến nhất là định dạng Docker image, đã được Open Container Initiative chuẩn hóa thành định dạng OCI image. Kubernetes hỗ trợ cả image tương thích Docker và OCI thông qua Docker và các runtime khác. Docker image cũng bao gồm siêu dữ liệu (metadata) bổ sung được container runtime sử dụng để khởi động một instance ứng dụng đang chạy dựa trên nội dung của container image.

Chương này bao gồm các chủ đề sau:

- Cách đóng gói một ứng dụng bằng định dạng Docker image
- Cách khởi động một ứng dụng bằng Docker container runtime

## Container Image

Với gần như tất cả mọi người, lần tương tác đầu tiên với bất kỳ công nghệ container nào là với một container image. Container image là một gói nhị phân đóng gói tất cả các file cần thiết để chạy một chương trình bên trong một OS container. Tùy vào cách bạn thử nghiệm container lần đầu, bạn sẽ xây dựng một container image từ filesystem cục bộ hoặc tải một image có sẵn từ container registry. Trong cả hai trường hợp, một khi container image đã có trên máy tính của bạn, bạn có thể chạy image đó để tạo ra một ứng dụng đang chạy bên trong một OS container.

Định dạng container image phổ biến và rộng khắp nhất là định dạng Docker image, được phát triển bởi dự án mã nguồn mở Docker để đóng gói, phân phối và chạy container bằng lệnh `docker`. Sau đó, Docker, Inc. và các bên khác đã bắt đầu công việc chuẩn hóa định dạng container image thông qua dự án Open Container Initiative (OCI). Mặc dù tiêu chuẩn OCI đã đạt cột mốc phát hành 1.0 vào giữa năm 2017, việc áp dụng các tiêu chuẩn này diễn ra chậm. Định dạng Docker image tiếp tục là tiêu chuẩn de facto và được tạo thành từ một chuỗi các lớp filesystem (filesystem layer). Mỗi lớp thêm, xóa hoặc sửa đổi các file từ lớp trước đó trong filesystem. Đây là một ví dụ về overlay filesystem. Hệ thống overlay được dùng cả khi đóng gói image và khi image thực sự được sử dụng. Trong thời gian chạy, có nhiều hiện thực cụ thể khác nhau của những filesystem như vậy, bao gồm `aufs`, `overlay` và `overlay2`.

> **PHÂN LỚP CONTAINER (CONTAINER LAYERING)**
>
> Các cụm từ "định dạng Docker image" và "container image" có thể hơi gây nhầm lẫn. Image không phải là một file đơn lẻ mà là một đặc tả cho một file manifest trỏ đến các file khác. Manifest và các file liên quan thường được người dùng xem như một đơn vị. Mức gián tiếp này cho phép lưu trữ và truyền tải hiệu quả hơn. Đi kèm với định dạng này là một API để tải lên và tải xuống image từ một image registry.
>
> Container image được xây dựng từ một chuỗi các lớp filesystem, trong đó mỗi lớp kế thừa và sửa đổi các lớp đi trước nó. Để giải thích chi tiết điều này, hãy xây dựng một vài container. Lưu ý rằng để chính xác, thứ tự các lớp nên là từ dưới lên, nhưng để dễ hiểu, chúng tôi làm theo cách ngược lại:
>
> ```
> .
> └── container A: chỉ có hệ điều hành cơ sở, ví dụ Debian
>     └── container B: xây dựng trên #A, thêm Ruby v2.1.10
>     └── container C: xây dựng trên #A, thêm Golang v1.6
> ```
>
> Tại thời điểm này chúng ta có ba container: A, B và C. B và C được rẽ nhánh từ A và không dùng chung gì ngoài các file của container cơ sở. Đi xa hơn, chúng ta có thể xây dựng trên B bằng cách thêm Ruby on Rails (phiên bản 4.2.6). Chúng ta cũng có thể muốn hỗ trợ một ứng dụng cũ yêu cầu phiên bản Ruby on Rails cũ hơn (ví dụ, phiên bản 3.2.x). Chúng ta có thể xây dựng một container image để hỗ trợ ứng dụng đó cũng dựa trên B, với kế hoạch một ngày nào đó sẽ chuyển ứng dụng lên phiên bản 4:
>
> ```
> . (tiếp tục từ trên)
> └── container B: xây dựng trên #A, thêm Ruby v2.1.10
>     └── container D: xây dựng trên #B, thêm Rails v4.2.6
>     └── container E: xây dựng trên #B, thêm Rails v3.2.x
> ```
>
> Về mặt khái niệm, mỗi lớp container image được xây dựng trên một lớp trước đó. Mỗi tham chiếu cha là một con trỏ. Mặc dù ví dụ ở đây là một tập container đơn giản, các container thực tế khác có thể là một phần của một đồ thị có hướng không chu trình (directed acyclic graph) rộng lớn hơn.

Container image thường được kết hợp với một file cấu hình container, cung cấp các chỉ thị về cách thiết lập môi trường container và thực thi điểm vào (entry point) của ứng dụng. Cấu hình container thường bao gồm thông tin về cách thiết lập mạng, cô lập namespace, các ràng buộc tài nguyên (cgroups), và những hạn chế syscall nào nên được áp lên một instance container đang chạy. Root filesystem của container và file cấu hình thường được gói lại bằng định dạng Docker image.

Container được chia thành hai loại chính:

- System container
- Application container

System container tìm cách mô phỏng máy ảo và thường chạy một quy trình khởi động đầy đủ. Chúng thường bao gồm một tập các dịch vụ hệ thống thường thấy trong VM, như `ssh`, `cron` và `syslog`. Khi Docker còn mới, những loại container này phổ biến hơn nhiều. Theo thời gian, chúng dần được xem là thực hành kém và application container đã được ưa chuộng hơn.

Application container khác với system container ở chỗ chúng thường chỉ chạy một chương trình duy nhất. Mặc dù việc chạy một chương trình cho mỗi container có thể trông như một ràng buộc không cần thiết, nó cung cấp mức độ chi tiết hoàn hảo để kết hợp các ứng dụng có khả năng mở rộng và là một triết lý thiết kế được Pod tận dụng rất nhiều. Chúng ta sẽ xem xét chi tiết cách Pod hoạt động trong Chương 5.

## Xây dựng Application Image với Docker

Nói chung, các hệ thống điều phối container như Kubernetes tập trung vào việc xây dựng và triển khai các hệ thống phân tán được tạo thành từ các application container. Do đó, chúng ta sẽ tập trung vào application container trong phần còn lại của chương này.

### Dockerfile

Một Dockerfile có thể được dùng để tự động hóa việc tạo một Docker container image.

Hãy bắt đầu bằng việc xây dựng một application image cho một chương trình Node.js đơn giản. Ví dụ này sẽ rất tương tự với nhiều ngôn ngữ động khác, như Python hay Ruby.

Ứng dụng npm/Node/Express đơn giản nhất có hai file: *package.json* (Ví dụ 2-1) và *server.js* (Ví dụ 2-2). Đặt chúng vào một thư mục rồi chạy `npm install express --save` để thiết lập phụ thuộc vào Express và cài đặt nó.

*Ví dụ 2-1. package.json*

```json
{
    "name": "simple-node",
    "version": "1.0.0",
    "description": "A sample simple application for Kubernetes Up & Running",
    "main": "server.js",
    "scripts": {
      "start": "node server.js"
    },
    "author": ""
}
```

*Ví dụ 2-2. server.js*

```javascript
var express = require('express');

var app = express();
app.get('/', function (req, res) {
  res.send('Hello World!');
});
app.listen(3000, function () {
    console.log('Listening on port 3000!');
    console.log(' http://localhost:3000');
});
```

Để đóng gói ứng dụng này thành một Docker image, tạo thêm hai file: *.dockerignore* (Ví dụ 2-3) và *Dockerfile* (Ví dụ 2-4). Dockerfile là một "công thức" về cách xây dựng container image, trong khi *.dockerignore* định nghĩa tập các file cần bỏ qua khi sao chép file vào image. Mô tả đầy đủ về cú pháp của Dockerfile có trên website của Docker.

*Ví dụ 2-3. .dockerignore*

```
node_modules
```

*Ví dụ 2-4. Dockerfile*

```dockerfile
# Start from a Node.js 16 (LTS) image                                    ①
FROM node:16

# Specify the directory inside the image in which all commands will run  ②
WORKDIR /usr/src/app

# Copy package files and install dependencies                            ③
COPY package*.json ./
RUN npm install
RUN npm install express

# Copy all of the app files into the image                               ④
COPY . .

# The default command to run when starting the container                 ⑤
CMD [ "npm", "start" ]
```

① Mọi Dockerfile đều được xây dựng trên các container image khác. Dòng này chỉ định rằng chúng ta bắt đầu từ image `node:16` trên Docker Hub. Đây là một image được cấu hình sẵn với Node.js 16.

② Dòng này thiết lập thư mục làm việc trong container image cho tất cả các lệnh tiếp theo.

③ Ba dòng này khởi tạo các phụ thuộc cho Node.js. Đầu tiên, chúng ta sao chép các file package vào image. Điều này sẽ bao gồm *package.json* và *package-lock.json*. Lệnh `RUN` sau đó chạy lệnh thích hợp trong container để cài đặt các phụ thuộc cần thiết.

④ Bây giờ chúng ta sao chép phần còn lại của các file chương trình vào image. Điều này sẽ bao gồm mọi thứ trừ *node_modules*, vì thư mục đó bị loại trừ thông qua file *.dockerignore*.

⑤ Cuối cùng, chúng ta chỉ định lệnh sẽ được chạy khi container được chạy.

Chạy lệnh sau để tạo Docker image `simple-node`:

```
$ docker build -t simple-node .
```

Khi bạn muốn chạy image này, bạn có thể làm bằng lệnh sau. Truy cập http://localhost:3000 để vào chương trình đang chạy trong container:

```
$ docker run --rm -p 3000:3000 simple-node
```

Tại thời điểm này, image `simple-node` của chúng ta nằm trong Docker registry cục bộ nơi image được xây dựng và chỉ có thể truy cập từ một máy duy nhất. Sức mạnh thực sự của Docker đến từ khả năng chia sẻ image trên hàng nghìn máy và với cộng đồng Docker rộng lớn hơn.

### Tối ưu hóa kích cỡ Image

Có một số cạm bẫy mà người ta gặp phải khi bắt đầu thử nghiệm với container image dẫn đến các image quá lớn. Điều đầu tiên cần nhớ là các file bị xóa bởi các lớp tiếp theo trong hệ thống thực ra vẫn còn hiện diện trong image; chúng chỉ không thể truy cập được. Hãy xem xét tình huống sau:

```
.
└── lớp A: chứa một file lớn tên là 'BigFile'
    └── lớp B: xóa 'BigFile'
           └── lớp C: xây dựng trên B bằng cách thêm một file nhị phân tĩnh
```

Bạn có thể nghĩ rằng *BigFile* không còn hiện diện trong image này. Rốt cuộc, khi bạn chạy image, nó không còn truy cập được nữa. Nhưng thực tế nó vẫn còn trong lớp A, điều này có nghĩa là bất cứ khi nào bạn push hoặc pull image, *BigFile* vẫn được truyền qua mạng, ngay cả khi bạn không còn có thể truy cập nó.

Một cạm bẫy khác xoay quanh việc cache và xây dựng image. Hãy nhớ rằng mỗi lớp là một delta độc lập so với lớp bên dưới nó. Mỗi lần bạn thay đổi một lớp, nó làm thay đổi mọi lớp đến sau nó. Việc thay đổi các lớp đi trước có nghĩa là chúng cần được xây dựng lại, push lại và pull lại để triển khai image của bạn đến môi trường phát triển.

Để hiểu điều này đầy đủ hơn, hãy xem xét hai image:

```
.
└── lớp A: chứa OS cơ sở
    └── lớp B: thêm mã nguồn server.js
           └── lớp C: cài đặt gói 'node'
```

so với:

```
.
└── lớp A: chứa OS cơ sở
       └── lớp B: cài đặt gói 'node'
           └── lớp C: thêm mã nguồn server.js
```

Có vẻ rõ ràng rằng cả hai image này sẽ hoạt động giống hệt nhau, và thực sự lần đầu chúng được pull, chúng đúng là như vậy. Tuy nhiên, hãy xem xét điều gì xảy ra khi *server.js* thay đổi. Trong trường hợp thứ hai, chỉ có thay đổi đó cần được pull hoặc push, nhưng trong trường hợp thứ nhất, cả *server.js* và lớp cung cấp gói `node` đều cần được pull và push, vì lớp `node` phụ thuộc vào lớp *server.js*. Nói chung, bạn muốn sắp xếp các lớp từ ít có khả năng thay đổi nhất đến có khả năng thay đổi nhiều nhất để tối ưu hóa kích cỡ image cho việc push và pull. Đây là lý do tại sao, trong Ví dụ 2-4, chúng ta sao chép các file *package\*.json* và cài đặt phụ thuộc trước khi sao chép phần còn lại của các file chương trình. Một nhà phát triển sẽ cập nhật và thay đổi các file chương trình thường xuyên hơn nhiều so với các phụ thuộc.

### Bảo mật Image

Khi nói đến bảo mật, không có đường tắt. Khi xây dựng các image cuối cùng sẽ chạy trong một cluster Kubernetes production, hãy đảm bảo tuân theo các thực hành tốt nhất về đóng gói và phân phối ứng dụng. Ví dụ, đừng xây dựng container với mật khẩu được nhúng sẵn, và điều này không chỉ áp dụng cho lớp cuối cùng mà cho bất kỳ lớp nào trong image. Một trong những vấn đề phản trực giác do các lớp container gây ra là việc xóa một file ở một lớp không xóa file đó khỏi các lớp đi trước. Nó vẫn chiếm dung lượng và bất kỳ ai có công cụ phù hợp đều có thể truy cập nó; một kẻ tấn công tinh ranh có thể đơn giản tạo một image chỉ gồm các lớp chứa mật khẩu.

Secret và image không bao giờ được trộn lẫn. Nếu bạn làm vậy, bạn sẽ bị hack, và bạn sẽ mang tai tiếng cho toàn bộ công ty hoặc bộ phận của mình. Tất cả chúng ta đều muốn một ngày nào đó được lên TV, nhưng có những cách tốt hơn để đạt được điều đó.

Ngoài ra, vì container image tập trung hẹp vào việc chạy các ứng dụng riêng lẻ, một thực hành tốt là tối thiểu hóa số file trong container image. Mỗi thư viện bổ sung trong image cung cấp một vector tiềm năng cho các lỗ hổng xuất hiện trong ứng dụng của bạn. Tùy vào ngôn ngữ, bạn có thể đạt được các image rất nhỏ với một tập phụ thuộc rất gọn. Tập nhỏ hơn này đảm bảo image của bạn không bị phơi nhiễm với các lỗ hổng trong những thư viện mà nó sẽ không bao giờ dùng.

### Xây dựng Image nhiều giai đoạn (Multistage Build)

Một trong những cách phổ biến nhất để vô tình xây dựng các image lớn là thực hiện việc biên dịch chương trình như một phần của quá trình xây dựng application container image. Việc biên dịch code như một phần của quá trình build image cảm giác rất tự nhiên, và đó là cách dễ nhất để xây dựng một container image từ chương trình của bạn. Vấn đề của việc này là nó để lại tất cả các công cụ phát triển không cần thiết, thường khá lớn, nằm rải rác trong image của bạn và làm chậm quá trình triển khai.

Để giải quyết vấn đề này, Docker đã giới thiệu multistage build. Với multistage build, thay vì tạo ra một image duy nhất, một Dockerfile thực sự có thể tạo ra nhiều image. Mỗi image được coi là một giai đoạn (stage). Các artifact có thể được sao chép từ các giai đoạn trước sang giai đoạn hiện tại.

Để minh họa cụ thể, chúng ta sẽ xem cách xây dựng ứng dụng ví dụ của mình, `kuard`. Đây là một ứng dụng khá phức tạp bao gồm một frontend React.js (với quy trình build riêng) sau đó được nhúng vào một chương trình Go. Chương trình Go chạy một API server backend mà frontend React.js tương tác với.

Một Dockerfile đơn giản có thể trông như thế này:

```dockerfile
FROM golang:1.17-alpine

# Install Node and NPM
RUN apk update && apk upgrade && apk add --no-cache git nodejs bash npm

# Get dependencies for Go part of build
RUN go get -u github.com/jteeuwen/go-bindata/...
RUN go get github.com/tools/godep
RUN go get github.com/kubernetes-up-and-running/kuard

WORKDIR /go/src/github.com/kubernetes-up-and-running/kuard

# Copy all sources in
COPY . .

# This is a set of variables that the build script expects
ENV VERBOSE=0
ENV PKG=github.com/kubernetes-up-and-running/kuard
ENV ARCH=amd64
ENV VERSION=test

# Do the build. This script is part of incoming sources.
RUN build/build.sh

CMD [ "/go/bin/kuard" ]
```

Dockerfile này tạo ra một container image chứa một file thực thi tĩnh, nhưng nó cũng chứa tất cả các công cụ phát triển Go, các công cụ để build frontend React.js và mã nguồn của ứng dụng, những thứ mà ứng dụng cuối cùng không cần đến. Image này, tính trên tất cả các lớp, có tổng dung lượng hơn 500 MB.

Để xem chúng ta sẽ làm điều này với multistage build như thế nào, hãy xem Dockerfile multistage sau:

```dockerfile
# STAGE 1: Build
FROM golang:1.17-alpine AS build

# Install Node and NPM
RUN apk update && apk upgrade && apk add --no-cache git nodejs bash npm

# Get dependencies for Go part of build
RUN go get -u github.com/jteeuwen/go-bindata/...
RUN go get github.com/tools/godep

WORKDIR /go/src/github.com/kubernetes-up-and-running/kuard

# Copy all sources in
COPY . .

# This is a set of variables that the build script expects
ENV VERBOSE=0
ENV PKG=github.com/kubernetes-up-and-running/kuard
ENV ARCH=amd64
ENV VERSION=test

# Do the build. Script is part of incoming sources.
RUN build/build.sh

# STAGE 2: Deployment
FROM alpine

USER nobody:nobody
COPY --from=build /go/bin/kuard /kuard

CMD [ "/kuard" ]
```

Dockerfile này tạo ra hai image. Image đầu tiên là image build, chứa trình biên dịch Go, toolchain React.js và mã nguồn của chương trình. Image thứ hai là image triển khai, chỉ chứa file nhị phân đã biên dịch. Xây dựng container image bằng multistage build có thể giảm kích cỡ container image cuối cùng của bạn đi hàng trăm megabyte và do đó tăng tốc đáng kể thời gian triển khai, vì nói chung, độ trễ triển khai bị giới hạn bởi hiệu năng mạng. Image cuối cùng được tạo ra từ Dockerfile này có kích cỡ khoảng 20 MB.

Các script này có trong repository `kuard` trên GitHub và bạn có thể build và chạy image này bằng các lệnh sau:

```
# Note: if you are running on Windows you may need to fix line-endings using:
# --config core.autocrlf=input
$ git clone https://github.com/kubernetes-up-and-running/kuard
$ cd kuard
$ docker build -t kuard .
$ docker run --rm -p 8080:8080 kuard
```

## Lưu trữ Image trong Registry từ xa

Một container image có ích gì nếu nó chỉ có sẵn trên một máy duy nhất?

Kubernetes dựa vào thực tế rằng các image được mô tả trong một Pod manifest có sẵn trên mọi máy trong cluster. Một lựa chọn để đưa image này đến tất cả các máy trong cluster là export image `kuard` và import nó trên từng máy. Chúng tôi không thể nghĩ ra điều gì tẻ nhạt hơn việc quản lý Docker image theo cách này. Quá trình import và export Docker image thủ công đầy rẫy nguy cơ lỗi do con người. Hãy nói không!

Tiêu chuẩn trong cộng đồng Docker là lưu trữ Docker image trong một registry từ xa. Có vô số lựa chọn khi nói đến Docker registry, và lựa chọn của bạn sẽ chủ yếu dựa trên nhu cầu của bạn về các tính năng bảo mật và cộng tác.

Nói chung, lựa chọn đầu tiên bạn cần đưa ra liên quan đến registry là dùng registry riêng tư (private) hay công khai (public). Public registry cho phép bất kỳ ai tải xuống các image được lưu trong registry, trong khi private registry yêu cầu xác thực để tải image. Khi chọn giữa public và private, việc xem xét trường hợp sử dụng của bạn là hữu ích.

Public registry rất tốt cho việc chia sẻ image với thế giới vì chúng cho phép sử dụng container image dễ dàng mà không cần xác thực. Bạn có thể dễ dàng phân phối phần mềm của mình dưới dạng container image và tự tin rằng người dùng ở mọi nơi sẽ có trải nghiệm chính xác như nhau.

Ngược lại, private registry là tốt nhất để lưu trữ các ứng dụng riêng tư cho dịch vụ của bạn mà bạn không muốn thế giới sử dụng. Ngoài ra, private registry thường cung cấp đảm bảo về tính sẵn sàng và bảo mật tốt hơn vì chúng dành riêng cho bạn và image của bạn thay vì phục vụ cả thế giới.

Bất kể thế nào, để push một image, bạn cần xác thực với registry. Bạn thường có thể làm điều này với lệnh `docker login`, mặc dù có một số khác biệt đối với một số registry nhất định. Trong các ví dụ của cuốn sách này, chúng tôi push lên registry của Google Cloud Platform, được gọi là Google Container Registry (GCR); các cloud khác, bao gồm Azure và Amazon Web Services (AWS), cũng có các container registry được lưu trữ. Với người dùng mới lưu trữ các image có thể đọc công khai, Docker Hub là một nơi tuyệt vời để bắt đầu.

Một khi đã đăng nhập, bạn có thể gắn tag cho image `kuard` bằng cách thêm tiền tố là Docker registry đích. Bạn cũng có thể thêm hậu tố là một định danh thường được dùng cho phiên bản hoặc biến thể của image đó, phân tách bằng dấu hai chấm (`:`):

```
$ docker tag kuard gcr.io/kuar-demo/kuard-amd64:blue
```

Sau đó bạn có thể push image `kuard`:

```
$ docker push gcr.io/kuar-demo/kuard-amd64:blue
```

Giờ image `kuard` đã có sẵn trên một registry từ xa, đã đến lúc triển khai nó bằng Docker. Khi chúng tôi push image lên GCR, nó được đánh dấu là public, nên nó sẽ có sẵn ở mọi nơi mà không cần xác thực.

## Container Runtime Interface

Kubernetes cung cấp một API để mô tả việc triển khai ứng dụng, nhưng dựa vào một container runtime để thiết lập application container bằng các API đặc thù cho container của OS đích. Trên hệ thống Linux, điều đó có nghĩa là cấu hình cgroups và namespace. Giao diện đến container runtime này được định nghĩa bởi tiêu chuẩn Container Runtime Interface (CRI). CRI API được hiện thực bởi nhiều chương trình khác nhau, bao gồm `containerd-cri` do Docker xây dựng và hiện thực `cri-o` do Red Hat đóng góp. Khi bạn cài đặt bộ công cụ Docker, runtime `containerd` cũng được cài đặt và được Docker daemon sử dụng.

Bắt đầu từ phiên bản 1.25 của Kubernetes, chỉ những container runtime hỗ trợ CRI mới hoạt động với Kubernetes. May mắn thay, các nhà cung cấp Kubernetes được quản lý đã làm cho quá trình chuyển đổi này gần như tự động đối với người dùng Kubernetes được quản lý.

### Chạy Container với Docker

Trong Kubernetes, container thường được khởi chạy bởi một daemon trên mỗi node gọi là kubelet; tuy nhiên, việc bắt đầu với container bằng công cụ dòng lệnh Docker sẽ dễ hơn. Công cụ Docker CLI có thể được dùng để triển khai container. Để triển khai một container từ image `gcr.io/kuar-demo/kuard-amd64:blue`, chạy lệnh sau:

```
$ docker run -d --name kuard \
   --publish 8080:8080 \
   gcr.io/kuar-demo/kuard-amd64:blue
```

Lệnh này khởi động container `kuard` và ánh xạ cổng 8080 trên máy cục bộ của bạn tới cổng 8080 trong container. Tùy chọn `--publish` có thể được viết tắt thành `-p`. Việc chuyển tiếp này là cần thiết vì mỗi container có địa chỉ IP riêng, nên việc lắng nghe trên *localhost* bên trong container không làm bạn lắng nghe trên máy của mình. Không có chuyển tiếp cổng, các kết nối sẽ không thể truy cập được từ máy của bạn. Tùy chọn `-d` chỉ định rằng container này nên chạy nền (daemon), trong khi `--name kuard` đặt cho container một tên thân thiện.

### Khám phá ứng dụng kuard

`kuard` cung cấp một giao diện web đơn giản, bạn có thể tải bằng cách trỏ trình duyệt tới http://localhost:3000 hoặc thông qua dòng lệnh:

```
$ curl http://localhost:8080
```

`kuard` cũng cung cấp một số chức năng thú vị mà chúng ta sẽ khám phá sau trong cuốn sách này.

### Giới hạn sử dụng tài nguyên

Docker cho phép các ứng dụng sử dụng ít tài nguyên hơn bằng cách cung cấp công nghệ cgroup nền tảng do Linux kernel cung cấp. Những khả năng này cũng được Kubernetes sử dụng để giới hạn tài nguyên mà mỗi Pod sử dụng.

#### Giới hạn tài nguyên bộ nhớ

Một trong những lợi ích chính của việc chạy ứng dụng trong container là khả năng hạn chế mức sử dụng tài nguyên. Điều này cho phép nhiều ứng dụng cùng tồn tại trên cùng một phần cứng và đảm bảo sử dụng công bằng.

Để giới hạn `kuard` ở 200 MB bộ nhớ và 1 GB không gian swap, dùng các cờ `--memory` và `--memory-swap` với lệnh `docker run`.

Dừng và xóa container `kuard` hiện tại:

```
$ docker stop kuard
$ docker rm kuard
```

Sau đó khởi động một container `kuard` khác bằng các cờ thích hợp để giới hạn mức sử dụng bộ nhớ:

```
$ docker run -d --name kuard \
  --publish 8080:8080 \
  --memory 200m \
  --memory-swap 1G \
  gcr.io/kuar-demo/kuard-amd64:blue
```

Nếu chương trình trong container sử dụng quá nhiều bộ nhớ, nó sẽ bị chấm dứt.

#### Giới hạn tài nguyên CPU

Một tài nguyên quan trọng khác trên máy là CPU. Hạn chế mức sử dụng CPU bằng cờ `--cpu-shares` với lệnh `docker run`:

```
$ docker run -d --name kuard \
  --publish 8080:8080 \
  --memory 200m \
  --memory-swap 1G \
  --cpu-shares 1024 \
  gcr.io/kuar-demo/kuard-amd64:blue
```

## Dọn dẹp

Khi đã xây dựng xong một image, bạn có thể xóa nó bằng lệnh `docker rmi`:

```
docker rmi <tag-name>
```

hoặc:

```
docker rmi <image-id>
```

Image có thể được xóa thông qua tên tag (ví dụ, `gcr.io/kuar-demo/kuard-amd64:blue`) hoặc thông qua image ID. Như với tất cả các giá trị ID trong công cụ `docker`, image ID có thể được viết tắt miễn là nó vẫn duy nhất. Thường chỉ cần ba hoặc bốn ký tự của ID.

Cần lưu ý rằng trừ khi bạn xóa một image một cách tường minh, nó sẽ tồn tại trên hệ thống của bạn mãi mãi, ngay cả khi bạn xây dựng một image mới với tên giống hệt. Việc xây dựng image mới này chỉ đơn giản chuyển tag sang image mới; nó không xóa hay thay thế image cũ.

Do đó, khi bạn lặp lại trong quá trình tạo một image mới, bạn thường sẽ tạo ra rất, rất nhiều image khác nhau chiếm dung lượng không cần thiết trên máy tính. Để xem các image hiện có trên máy, bạn có thể dùng lệnh `docker images`. Sau đó bạn có thể xóa các tag không còn dùng nữa.

Docker cung cấp một công cụ gọi là `docker system prune` để dọn dẹp tổng quát. Lệnh này sẽ xóa tất cả các container đã dừng, tất cả các image không có tag, và tất cả các lớp image không dùng đến được cache như một phần của quá trình build. Hãy dùng nó cẩn thận.

Một cách tiếp cận tinh vi hơn một chút là thiết lập một cron job để chạy trình thu gom rác image. Ví dụ, bạn có thể dễ dàng chạy `docker system prune` như một cron job định kỳ, một lần mỗi ngày hoặc một lần mỗi giờ, tùy vào số lượng image bạn đang tạo.

## Tóm tắt

Application container cung cấp một trừu tượng hóa sạch sẽ cho ứng dụng, và khi được đóng gói theo định dạng Docker image, ứng dụng trở nên dễ xây dựng, triển khai và phân phối. Container cũng cung cấp sự cô lập giữa các ứng dụng chạy trên cùng một máy, giúp tránh xung đột phụ thuộc.

Trong các chương sau, chúng ta sẽ thấy khả năng mount các thư mục bên ngoài có nghĩa là chúng ta không chỉ có thể chạy các ứng dụng stateless trong container, mà còn cả các ứng dụng như MySQL và những ứng dụng khác tạo ra nhiều dữ liệu.
