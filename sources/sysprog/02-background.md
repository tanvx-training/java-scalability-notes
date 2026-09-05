# Chương 2. Kiến thức nền tảng (Background)

> Bản dịch tiếng Việt từ *System Programming Coursebook* (University of Illinois, CS 241) — B. Venkatesh, L. Angrave et al. Tài liệu gốc được phát hành theo giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); bản dịch giữ nguyên giấy phép này. Nguồn: https://github.com/illinois-cs241/coursebook

> Đôi khi, hành trình ngàn bước bắt đầu bằng việc học cách bước đi.

## 2.1 Kiến trúc hệ thống (Systems Architecture)

Mục này là phần ôn tập ngắn gọn các chủ đề về Kiến trúc hệ thống mà bạn sẽ cần cho môn Lập trình hệ thống.

### 2.1.1 Assembly (Hợp ngữ)

Assembly là gì? Assembly là cấp thấp nhất mà bạn có thể tiếp cận ngôn ngữ máy mà không phải viết trực tiếp các số 1 và 0. Mỗi máy tính có một kiến trúc, và mỗi kiến trúc có một hợp ngữ đi kèm. Mỗi lệnh assembly ánh xạ 1:1 tới một dãy các số 1 và 0 cho máy tính biết chính xác phải làm gì. Ví dụ, đoạn sau trong hợp ngữ x86 được dùng rộng rãi sẽ cộng một vào địa chỉ bộ nhớ 20 [13] – bạn cũng có thể xem trong [8], Mục 2A, phần lệnh `add`, dù ở đó mô tả dài dòng hơn.

```asm
add BYTE PTR [0x20], 1
```

Tại sao chúng tôi nhắc đến điều này? Bởi vì điều quan trọng là, mặc dù bạn sẽ làm hầu hết mọi thứ trong môn này bằng C, thì đây chính là thứ mà mã nguồn của bạn được dịch thành. Điều này kéo theo những hệ quả nghiêm túc đối với race condition (tình huống tranh chấp) và các atomic operation (phép toán nguyên tử).

### 2.1.2 Các phép toán nguyên tử (Atomic Operations)

Một phép toán là atomic (nguyên tử) nếu không có bộ xử lý nào khác được phép ngắt nó giữa chừng. Lấy ví dụ đoạn mã assembly ở trên để cộng một vào một thanh ghi. Trong kiến trúc thực tế, nó có thể gồm vài bước khác nhau trên mạch điện. Phép toán có thể bắt đầu bằng việc lấy giá trị bộ nhớ từ thanh RAM, rồi lưu vào cache hoặc một thanh ghi, và cuối cùng ghi ngược trở lại [12] – xem phần mô tả về fetch-and-add, dù vi kiến trúc của bạn có thể khác. Hoặc tùy theo các tối ưu hiệu năng, nó có thể giữ giá trị đó trong cache hay trong một thanh ghi cục bộ của process đó – hãy thử dump mã assembly được tối ưu với `-O2` của thao tác tăng một biến. Vấn đề nảy sinh khi hai bộ xử lý cố làm việc đó cùng lúc. Hai bộ xử lý có thể cùng lúc sao chép giá trị tại địa chỉ bộ nhớ, cộng một, rồi lưu cùng một kết quả trở lại, khiến giá trị chỉ được tăng lên một lần. Đó là lý do trên các hệ thống hiện đại có một tập lệnh đặc biệt gọi là atomic operation. Nếu một lệnh là atomic, nó bảo đảm rằng tại mỗi thời điểm chỉ có một bộ xử lý hoặc một thread thực hiện bất kỳ bước trung gian nào. Với x86, điều này được thực hiện bằng tiền tố `lock` [8, tr. 1120].

```asm
lock add BYTE PTR [0x20], 1
```

Tại sao chúng ta không làm vậy với mọi thứ? Vì nó làm lệnh chạy chậm hơn! Nếu mỗi lần máy tính làm một việc gì đó đều phải chắc chắn rằng các nhân hay bộ xử lý khác không đang làm gì, nó sẽ chậm hơn rất nhiều. Phần lớn thời gian chúng tôi phân biệt các trường hợp này một cách có chủ ý. Nghĩa là, chúng tôi sẽ nói rõ khi nào dùng thứ gì đó như thế này. Phần lớn thời gian bạn có thể giả định rằng các lệnh là không khóa (unlocked).

### 2.1.3 Bộ nhớ đệm (Caching)

À, Caching. Một trong những bài toán lớn nhất của khoa học máy tính. Caching mà chúng ta nói đến ở đây là caching của bộ xử lý. Nếu một địa chỉ cụ thể đã nằm trong cache khi đọc hay ghi, bộ xử lý sẽ thực hiện phép toán (chẳng hạn phép cộng) trên cache và cập nhật bộ nhớ thật sau, vì cập nhật bộ nhớ rất chậm [9, Mục 3.4]. Nếu chưa có, bộ xử lý yêu cầu một khối bộ nhớ từ chip nhớ và lưu vào cache, đẩy ra ngoài trang ít được dùng gần đây nhất – việc này phụ thuộc vào chính sách caching, nhưng Intel thực sự dùng cách này. Sở dĩ làm vậy vì cache L3 của bộ xử lý nhanh hơn khoảng ba lần so với bộ nhớ chính xét về thời gian truy cập [11, tr. 22], dù tốc độ chính xác thay đổi tùy xung nhịp và kiến trúc. Đương nhiên, điều này dẫn đến vấn đề vì tồn tại hai bản sao khác nhau của cùng một giá trị; trong bài báo được trích dẫn, trường hợp này được gọi là một unshared line (dòng cache không chia sẻ). Đây không phải môn học về caching, nhưng hãy biết điều này có thể ảnh hưởng đến mã của bạn ra sao. Một danh sách ngắn, chưa đầy đủ, có thể là

1. Race condition! Nếu một giá trị được lưu trong hai cache của hai bộ xử lý khác nhau, thì giá trị đó chỉ nên được truy cập bởi một thread duy nhất.
2. Tốc độ. Với cache, chương trình của bạn có thể trông nhanh hơn một cách bí ẩn. Cứ giả định rằng những lần đọc/ghi vừa mới diễn ra gần đây, hoặc nằm cạnh nhau trong bộ nhớ, thì nhanh.
3. Tác dụng phụ. Mỗi lần đọc hay ghi đều ảnh hưởng đến trạng thái cache. Dù phần lớn thời gian điều này không giúp ích cũng chẳng gây hại, bạn vẫn cần biết. Hãy xem hướng dẫn lập trình của Intel về tiền tố `lock` để biết thêm thông tin.

### 2.1.4 Ngắt (Interrupts)

Ngắt (interrupt) là một phần quan trọng của lập trình hệ thống. Về bản chất, một interrupt là một tín hiệu điện được gửi tới bộ xử lý khi có sự kiện xảy ra – đây là ngắt phần cứng (hardware interrupt) [3]. Sau đó phần cứng quyết định đây là việc nó nên tự xử lý (ví dụ xử lý đầu vào bàn phím hay chuột với các loại bàn phím, chuột đời cũ) hay nên chuyển cho hệ điều hành. Hệ điều hành lại quyết định đây là việc nó nên xử lý (ví dụ nạp một bảng trang từ đĩa) hay việc ứng dụng nên xử lý (ví dụ một `SEGFAULT`). Nếu hệ điều hành quyết định rằng process hay chương trình phải lo việc này, nó gửi một software fault (lỗi phần mềm) và lỗi đó được lan truyền tiếp. Ứng dụng khi đó quyết định đây là lỗi (`SEGFAULT`) hay không (ví dụ `SIGPIPE`) và báo cho người dùng. Ứng dụng cũng có thể gửi signal (tín hiệu) tới kernel và tới cả phần cứng. Đây là một sự đơn giản hóa quá mức, vì có những lỗi phần cứng nhất định không thể bỏ qua hay che (mask) đi được, nhưng môn này không nhằm dạy bạn xây dựng một hệ điều hành.

Một ứng dụng quan trọng của cơ chế này là: đây chính là cách các system call (lời gọi hệ thống) được phục vụ! Có một tập thanh ghi được quy ước rõ ràng để đặt các đối số theo quy định của kernel, cùng với một "số hiệu" system call cũng do kernel định nghĩa. Sau đó hệ điều hành kích hoạt một interrupt mà kernel bắt lấy và phục vụ system call đó [7].

Cả những người phát triển hệ điều hành lẫn những người thiết kế tập lệnh đều không thích chi phí của việc gây ra một interrupt cho mỗi system call. Ngày nay, các hệ thống dùng `SYSENTER` và `SYSEXIT`, cung cấp một cách gọn gàng hơn để chuyển quyền điều khiển một cách an toàn vào kernel và quay trở lại một cách an toàn. "An toàn" nghĩa là gì thì rõ ràng nằm ngoài phạm vi môn học này, nhưng cơ chế đó vẫn tồn tại.

### 2.1.5 Tùy chọn: Hyperthreading (Siêu phân luồng)

Hyperthreading là một công nghệ mới và hoàn toàn không phải là multithreading (đa luồng). Hyperthreading cho phép một nhân vật lý xuất hiện như nhiều nhân ảo đối với hệ điều hành [8, tr. 51]. Hệ điều hành khi đó có thể lập lịch các process lên các nhân ảo này và một nhân sẽ thực thi chúng. Mỗi nhân đan xen các process hoặc thread. Trong khi nhân đang đợi một truy cập bộ nhớ hoàn tất, nó có thể thực hiện vài lệnh của một thread thuộc process khác. Kết quả chung là nhiều lệnh hơn được thực thi trong thời gian ngắn hơn. Điều này có khả năng cho phép bạn giảm số nhân cần thiết để vận hành các thiết bị nhỏ hơn.

Nhưng ở đây có "rồng dữ" đấy. Với hyperthreading, bạn phải cẩn trọng với các tối ưu hóa. Có một lỗi hyperthreading nổi tiếng khiến chương trình bị crash nếu có ít nhất hai process được lập lịch trên cùng một nhân vật lý, dùng những thanh ghi cụ thể, trong một vòng lặp chặt. Vấn đề thực sự được giải thích tốt hơn dưới góc nhìn kiến trúc. Nhưng biểu hiện thực tế của nó lại được tìm ra bởi những lập trình viên hệ thống làm việc trên nhánh chính của OCaml [10].

## 2.2 Gỡ lỗi và môi trường làm việc (Debugging and Environments)

Tôi sẽ nói cho bạn một bí mật về môn học này: nó là về việc làm việc thông minh hơn chứ không phải chăm chỉ hơn. Môn học có thể tốn thời gian, nhưng lý do nhiều người thấy nó như vậy (và lý do nhiều sinh viên khác lại không thấy vậy) nằm ở mức độ quen thuộc tương đối của mỗi người với công cụ của mình. Hãy cùng điểm qua một số công cụ phổ biến mà bạn sẽ làm việc cùng và cần thành thạo.

### 2.2.1 ssh

`ssh` là viết tắt của Secure Shell [2]. Đó là một giao thức mạng cho phép bạn tạo ra một shell trên một máy ở xa. Trong môn học này, hầu hết thời gian bạn sẽ cần ssh vào VM của mình như sau

```bash
$ ssh netid@sem-cs241-VM.cs.illinois.edu
```

Nếu bạn không muốn gõ mật khẩu mỗi lần, bạn có thể tạo một khóa ssh định danh duy nhất cho máy của bạn. Nếu bạn đã có sẵn cặp khóa, có thể bỏ qua đến bước copy id.

```bash
> ssh-keygen -t rsa -b 4096
# Do whatever keygen tells you
# Don't feel like you need a passcode if your login password is secure
> ssh-copy-id netid@sem-cs241-VM.cs.illinois.edu
# Enter your password for maybe the final time
> ssh netid@sem-cs241-VM.cs.illinois.edu
```

Nếu bạn vẫn thấy như vậy là quá nhiều thứ phải gõ, bạn luôn có thể đặt bí danh (alias) cho các host. Bạn có thể cần khởi động lại VM hoặc nạp lại `sshd` để thay đổi có hiệu lực. File cấu hình này có trên các bản phân phối Linux và Mac. Với Windows, bạn sẽ phải dùng Windows Linux Subsystem hoặc cấu hình bí danh trong PuTTY.

```bash
> cat ~/.ssh/config
Host vm
  User        netid
  HostName    sem-cs241-VM.cs.illinois.edu
> ssh vm
```

### 2.2.2 git

`git` là gì? Git là một hệ thống quản lý phiên bản (version control system). Nghĩa là git lưu trữ toàn bộ lịch sử của một thư mục. Chúng ta gọi thư mục đó là một repository (kho mã). Vậy bạn cần biết một vài điều. Thứ nhất, hãy tạo repository của bạn bằng công cụ repo creator. Nếu bạn chưa đăng nhập vào GitHub Enterprise, hãy chắc chắn làm việc đó, nếu không repository sẽ không được tạo cho bạn. Sau bước đó, repository của bạn đã được tạo trên máy chủ. Git là một hệ thống quản lý phiên bản phi tập trung, nghĩa là bạn cần đưa một repository về VM của mình. Chúng ta làm việc này bằng lệnh clone. Dù có làm gì đi nữa, đừng làm theo hướng dẫn trong README.md.

```bash
$ git clone https://github-dev.cs.illinois.edu/cs241-fa18/<netid>.git
```

Lệnh này sẽ tạo một repository cục bộ. Quy trình làm việc là: bạn sửa đổi trên repository cục bộ, thêm (add) các thay đổi vào commit hiện tại, thực sự commit, rồi đẩy (push) các thay đổi lên máy chủ.

```bash
$ # edit the file, maybe using vim
$ git add <file>
$ git commit -m "Committing my file"
$ git push origin master
```

Để giải thích git cho tốt, bạn cần hiểu rằng, cho mục đích của chúng ta, git sẽ trông giống một danh sách liên kết. Bạn sẽ luôn ở đầu (head) của nhánh master, và bạn sẽ lặp đi lặp lại vòng edit-add-commit-push. Chúng tôi có một nhánh riêng trên GitHub mà chúng tôi đẩy phản hồi lên dưới một nhánh cụ thể, bạn có thể xem nó trên trang web GitHub. File markdown ở đó sẽ chứa thông tin về các test case và kết quả (chẳng hạn standard out).

Thỉnh thoảng git có thể bị hỏng. Dưới đây là danh sách các lệnh mà bạn có lẽ sẽ không cần đến để sửa repo của mình

1. git-cherry-pick
2. git-pack
3. git-gc
4. git-clean
5. git-rebase
6. git-stash/git-apply/git-pop
7. git-branch

Nếu bạn đang ở trên một nhánh, và bạn không thấy hoặc là

```text
$ git status
On branch master
Your branch is up-to-date with 'origin/master'.
nothing to commit, working directory clean
```

hoặc

```text
$ git status
On branch master
Your branch is up-to-date with 'origin/master'.
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

          modified: <FILE>
          ...

no changes added to commit (use "git add" and/or "git commit -a")
```

Mà lại thấy thứ gì đó như

```text
$ git status
HEAD detached at 4bc4426
nothing to commit, working directory clean
```

Đừng hoảng, nhưng repository của bạn có thể đang ở trạng thái không làm việc được. Nếu bạn chưa cận kề hạn nộp, hãy đến giờ office hours hoặc đặt câu hỏi trên Piazza, chúng tôi rất sẵn lòng giúp. Trong tình huống khẩn cấp, hãy xóa repository và clone lại (bạn sẽ phải thêm bản release như ở trên). Việc này sẽ làm mất mọi thay đổi cục bộ chưa commit. **Hãy chắc chắn sao chép các file bạn đang làm dở ra ngoài thư mục, xóa, rồi chép chúng trở lại.**

Nếu bạn muốn tìm hiểu thêm về git, có gần như vô số hướng dẫn và tài nguyên trực tuyến có thể giúp bạn. Dưới đây là vài liên kết hữu ích

1. https://git-scm.com/docs/gittutorial
2. https://www.atlassian.com/git/tutorials/what-is-version-control
3. https://thenewstack.io/tutorial-git-for-absolutely-everyone/

### 2.2.3 Trình soạn thảo (Editors)

Một số người xem đây là cơ hội để học một trình soạn thảo mới, số khác thì không hẳn vậy. Phần đầu dành cho những bạn muốn học một trình soạn thảo mới. Trong cuộc chiến trình soạn thảo kéo dài hàng thập kỷ, chúng ta đi đến trận chiến vim đối đầu emacs.

Vim là một trình soạn thảo văn bản và là một tiện ích kiểu Unix. Bạn vào vim bằng cách gõ `vim [file]`. Lệnh này đưa bạn vào trình soạn thảo. Bạn bắt đầu ở chế độ normal. Trong chế độ này, bạn có thể di chuyển bằng nhiều phím, phổ biến nhất là `jklh`. Để thoát vim từ chế độ này, bạn cần gõ `:q` để thoát. Nếu có chỉnh sửa chưa lưu, bạn phải hoặc lưu lại `:w`, lưu và thoát `:wq`, hoặc bỏ thay đổi `:q!`. Để chỉnh sửa, bạn có thể gõ `i` để chuyển sang chế độ insert, hoặc `a` để chuyển sang chế độ insert sau vị trí con trỏ. Đó là những điều cơ bản về vim.

Emacs thì giống một lối sống hơn, và tôi không nói theo nghĩa bóng đâu. Nhiều người nói emacs là một hệ điều hành mạnh mẽ nhưng thiếu một trình soạn thảo văn bản tử tế. Điều đó có nghĩa là emacs có thể chứa một terminal, một phiên gdb, một phiên ssh, mã nguồn và rất nhiều thứ khác. Sẽ không có cách nào xứng đáng hơn để giới thiệu bạn với gnu-emacs ngoài chính tài liệu của GNU https://www.gnu.org/software/emacs/tour/. Chỉ cần lưu ý rằng emacs mạnh đến mức điên rồ. Bạn có thể làm gần như mọi thứ với nó. Có kha khá sinh viên thích khía cạnh IDE của các ngôn ngữ lập trình khác. Hãy biết rằng bạn có thể cấu hình emacs thành một IDE, nhưng bạn phải học một chút Lisp http://martinsosic.com/development/emacs/2017/12/09/emacs-cpp-ide.html.

Rồi còn những bạn thích dùng trình soạn thảo của riêng mình. Điều đó hoàn toàn ổn. Cho việc này, chúng tôi yêu cầu `sshfs`, vốn đã được port sang nhiều loại máy khác nhau.

1. Windows https://github.com/billziss-gh/sshfs-win
2. Mac https://github.com/osxfuse/osxfuse/wiki/SSHFS
3. Linux https://help.ubuntu.com/community/SSHFS

Khi đó, các file trên VM của bạn được đồng bộ với các file trên máy của bạn, và mọi chỉnh sửa sẽ được đồng bộ theo.

Tại thời điểm viết, một tác giả thích dùng spacemacs http://spacemacs.org/, thứ kết hợp cả vim lẫn emacs cùng với những khó khăn của cả hai. Tôi sẽ "lên bục diễn thuyết" vì sao tôi thích nó, nhưng xin cảnh báo rằng nếu bạn bắt đầu với hoàn toàn không có kinh nghiệm vim hay emacs, thì đường cong học tập cộng với môn học này có thể là quá sức.

1. Có thể mở rộng. Spacemacs có thiết kế sạch sẽ viết bằng lisp. Có hàng trăm gói sẵn sàng để cài đặt chỉ bằng cách chỉnh file cấu hình spacemacs rồi nạp lại, làm đủ mọi việc từ kiểm tra cú pháp, phân tích tĩnh tự động, v.v.
2. Hầu hết những phần hay của vim và emacs. Emacs giỏi làm mọi thứ nhờ là một trình soạn thảo nhanh. Vim giỏi ở chỗ chỉnh sửa nhanh và di chuyển nhanh. Spacemacs là sự kết hợp tốt nhất của cả hai, cho phép dùng phím tắt kiểu vim trên toàn bộ những điều tuyệt vời của emacs bên dưới.
3. Rất nhiều cấu hình đã được làm sẵn. Khác với một bản emacs cài mới, rất nhiều cấu hình về ngôn ngữ và dự án đã được làm sẵn cho bạn như neotree, helm, các language layer khác nhau. Tất cả những gì bạn phải làm là điều hướng neotree đến thư mục gốc của dự án và emacs sẽ biến thành một IDE cho ngôn ngữ lập trình đó.

Nhưng dĩ nhiên, mỗi người mỗi ý. Nhiều người sẽ lập luận rằng các "cao thủ" trình soạn thảo dành nhiều thời gian để chỉnh sửa trình soạn thảo của họ hơn là thực sự soạn thảo.

### 2.2.4 Mã sạch (Clean Code)

Hãy làm cho mã của bạn có tính mô-đun bằng cách dùng các hàm trợ giúp (helper function). Nếu có một tác vụ lặp đi lặp lại (ví dụ lấy con trỏ tới các khối liền kề trong MP malloc), hãy biến chúng thành hàm trợ giúp. Và hãy đảm bảo mỗi hàm làm tốt một việc để bạn không phải gỡ lỗi hai lần. Giả sử chúng ta đang làm selection sort bằng cách tìm phần tử nhỏ nhất ở mỗi vòng lặp như sau,

```c
void selection_sort(int *a, long len){
    for(long i = len-1; i > 0; --i){
        long max_index = i;
        for(long j = len-1; j >= 0; --j){
            if(a[max_index] < a[j]){
                max_index = j;
            }
        }
        int temp = a[i];
        a[i] = a[max_index];
        a[max_index] = temp;
    }

}
```

Nhiều người có thể nhìn thấy lỗi trong đoạn mã, nhưng sẽ hữu ích nếu tái cấu trúc (refactor) phương thức trên thành

```c
long max_index(int *a, long start, long end);
void swap(int *a, long idx1, long idx2);
void selection_sort(int *a, long len);
```

Và lỗi khi đó nằm cụ thể trong một hàm. Xét cho cùng, môn này là về viết chương trình hệ thống, không phải môn về tái cấu trúc/gỡ lỗi mã của bạn. Thực tế, phần lớn mã kernel tệ đến mức bạn chẳng muốn đọc – lời biện hộ ở đó là nó buộc phải như vậy. Nhưng vì mục đích gỡ lỗi, về lâu dài bạn có thể được lợi khi áp dụng một vài thực hành như thế này.

### 2.2.5 Khẳng định (Asserts)

Hãy dùng assertion (khẳng định) để chắc chắn rằng mã của bạn hoạt động đúng đến một điểm nhất định – và quan trọng là để chắc chắn bạn không làm hỏng nó về sau. Ví dụ, nếu cấu trúc dữ liệu của bạn là một danh sách liên kết đôi, bạn có thể làm gì đó như `assert(node == node->next->prev)` để khẳng định rằng node kế tiếp có con trỏ trỏ về node hiện tại. Bạn cũng có thể kiểm tra con trỏ trỏ đến một khoảng địa chỉ bộ nhớ như mong đợi, khác null, `->size` hợp lý, v.v. Macro `DEBUG` sẽ tắt mọi assertion, nên đừng quên đặt nó khi bạn đã gỡ lỗi xong [1]. *(ND: thực tế macro tắt `assert` là `NDEBUG`.)*

Dưới đây là một ví dụ nhanh với assert. Giả sử chúng ta đang viết mã dùng `memcpy`. Chúng ta muốn đặt một assert phía trước để kiểm tra xem hai vùng nhớ có chồng lấn nhau không. Nếu chúng chồng lấn, `memcpy` rơi vào undefined behavior (hành vi không xác định), nên chúng ta muốn bắt vấn đề đó ngay thay vì để về sau.

```c
assert(!(src < dest+n && dest < src+n)); //Checks overlap
memcpy(dest, src, n);
```

Kiểm tra này có thể được tắt lúc biên dịch, nhưng sẽ giúp bạn tiết kiệm vô số rắc rối khi gỡ lỗi!

## 2.3 Valgrind

Valgrind là một bộ công cụ được thiết kế để cung cấp các công cụ gỡ lỗi và đo hiệu năng (profiling) nhằm làm chương trình của bạn đúng đắn hơn và phát hiện một số vấn đề lúc chạy [4]. Công cụ được dùng nhiều nhất trong số đó là Memcheck, có thể phát hiện nhiều lỗi liên quan đến bộ nhớ thường gặp trong các chương trình C và C++ và có thể dẫn đến crash cũng như hành vi không đoán trước được (ví dụ các buffer bộ nhớ chưa được giải phóng). Để chạy Valgrind với chương trình của bạn:

```bash
valgrind --leak-check=full --show-leak-kinds=all myprogram arg1 arg2
```

Các đối số là tùy chọn, và công cụ mặc định được chạy là Memcheck. Kết quả sẽ được trình bày dưới dạng: số lần cấp phát, số lần giải phóng và số lỗi. Giả sử chúng ta có một chương trình đơn giản như sau:

```c
#include <stdlib.h>

void dummy_function() {
    int* x = malloc(10 * sizeof(int));
    x[10] = 0;       // error 1: Out of bounds write, as you can see here we write to an out of bound memory address.
}                   // error 2: Memory Leak, x is allocated at function exit.

int main(void) {
    dummy_function();
    return 0;
}
```

Chương trình này biên dịch và chạy mà không có lỗi. Hãy xem Valgrind sẽ in ra gì.

```text
==29515== Memcheck, a memory error detector
==29515== Copyright (C) 2002-2015, and GNU GPL'd, by Julian Seward et al.
==29515== Using Valgrind-3.11.0 and LibVEX; rerun with -h for copyright info
==29515== Command: ./a
==29515==
==29515== Invalid write of size 4
==29515== at 0x400544: dummy_function (in /home/rafi/projects/exocpp/a)
==29515== by 0x40055A: main (in /home/rafi/projects/exocpp/a)
==29515== Address 0x5203068 is 0 bytes after a block of size 40 alloc'd
==29515== at 0x4C2DB8F: malloc (in /usr/lib/valgrind/vgpreload_memcheck-amd64-linux.so)
==29515== by 0x400537: dummy_function (in /home/rafi/projects/exocpp/a)
==29515== by 0x40055A: main (in /home/rafi/projects/exocpp/a)
==29515==
==29515==
==29515== HEAP SUMMARY:
==29515==    in use at exit: 40 bytes in 1 blocks
==29515== total heap usage: 1 allocs, 0 frees, 40 bytes allocated
==29515==
==29515== LEAK SUMMARY:
==29515== definitely lost: 40 bytes in 1 blocks
==29515== indirectly lost: 0 bytes in 0 blocks
==29515==     possibly lost: 0 bytes in 0 blocks
==29515== still reachable: 0 bytes in 0 blocks
==29515==        suppressed: 0 bytes in 0 blocks
==29515== Rerun with --leak-check=full to see details of leaked memory
==29515==
==29515== For counts of detected and suppressed errors, rerun with: -v
==29515== ERROR SUMMARY: 1 errors from 1 contexts (suppressed: 0 from 0)
```

**Invalid write** (ghi không hợp lệ): Nó phát hiện việc chúng ta ghi vượt quá khối heap – ghi ra ngoài một khối đã cấp phát.

**Definitely lost** (chắc chắn bị mất): Rò rỉ bộ nhớ (memory leak) – có lẽ bạn đã quên giải phóng một khối bộ nhớ.

Valgrind là một công cụ hiệu quả để kiểm tra lỗi lúc chạy. C khá đặc biệt ở những hành vi như vậy, nên sau khi biên dịch chương trình, bạn có thể dùng Valgrind để sửa những lỗi mà trình biên dịch có thể bỏ sót và thường chỉ xảy ra khi chương trình đang chạy.

Để biết thêm thông tin, bạn có thể tham khảo tài liệu hướng dẫn [4].

### 2.3.1 TSAN

ThreadSanitizer là một công cụ của Google, được tích hợp sẵn trong clang và gcc, giúp bạn phát hiện race condition trong mã của mình [5]. Lưu ý rằng chạy với tsan sẽ làm mã của bạn chậm đi một chút. Xét đoạn mã sau.

```c
#include <pthread.h>
#include <stdio.h>

int global;

void *Thread1(void *x) {
    global++;
    return NULL;
}

int main() {
    pthread_t t[2];
    pthread_create(&t[0], NULL, Thread1, NULL);
    global = 100;
    pthread_join(t[0], NULL);
}
// compile with gcc -fsanitize=thread -pie -fPIC -ltsan -g simple_race.c
```

Chúng ta có thể thấy có một race condition trên biến `global`. Cả thread chính lẫn thread được tạo ra đều sẽ cố thay đổi giá trị cùng lúc. Nhưng liệu ThreadSanitizer có bắt được không?

```text
$ ./a.out
==================
WARNING: ThreadSanitizer: data race (pid=28888)
  Read of size 4 at 0x7f73ed91c078 by thread T1:
    #0 Thread1 /home/zmick2/simple_race.c:7 (exe+0x000000000a50)
    #1 :0 (libtsan.so.0+0x00000001b459)

  Previous write of size 4 at 0x7f73ed91c078 by main thread:
    #0 main /home/zmick2/simple_race.c:14 (exe+0x000000000ac8)

  Thread T1 (tid=28889, running) created by main thread at:
    #0 :0 (libtsan.so.0+0x00000001f6ab)
    #1 main /home/zmick2/simple_race.c:13 (exe+0x000000000ab8)

SUMMARY: ThreadSanitizer: data race /home/zmick2/simple_race.c:7 Thread1
==================
ThreadSanitizer: reported 1 warnings
```

Nếu chúng ta biên dịch với cờ debug, nó còn cho biết cả tên biến nữa.

## 2.4 GDB

GDB là viết tắt của GNU Debugger. GDB là một chương trình giúp bạn truy tìm lỗi bằng cách gỡ lỗi tương tác [6]. Nó có thể khởi động và dừng chương trình của bạn, nhìn ngó xung quanh, và đặt vào các ràng buộc và kiểm tra tùy ý. Dưới đây là vài ví dụ.

**Đặt breakpoint bằng mã (programmatically)** Một breakpoint (điểm dừng) là một dòng mã mà tại đó bạn muốn việc thực thi dừng lại và trả quyền điều khiển về cho trình gỡ lỗi. Một mẹo hữu ích khi gỡ lỗi các chương trình C phức tạp bằng GDB là đặt breakpoint ngay trong mã nguồn.

```c
int main() {
    int val = 1;
    val = 42;
    asm("int $3"); // set a breakpoint here
    val = 7;
}
```

```text
$ gcc main.c -g -o main
$ gdb --args ./main
(gdb) r
[...]
Program received signal SIGTRAP, Trace/breakpoint trap.
main () at main.c:6
6     val = 7;
(gdb) p val
$1 = 42
```

Bạn cũng có thể đặt breakpoint theo cách lập trình. Giả sử chúng ta không bật tối ưu hóa và các số dòng như sau

```text
1. int main() {
2.     int val = 1;
3.     val = 42;
4.     val = 7;
5. }
```

Giờ chúng ta có thể đặt breakpoint trước khi chương trình khởi chạy.

```text
$ gcc main.c -g -o main
$ gdb --args ./main
(gdb) break main.c:4
[...]
(gdb) p val
$1 = 42
```

**Kiểm tra nội dung bộ nhớ** Chúng ta cũng có thể dùng gdb để kiểm tra nội dung của các vùng nhớ khác nhau. Ví dụ,

```c
int main() {
    char bad_string[3] = {'C', 'a', 't'};
    printf("%s", bad_string);
}
```

Biên dịch xong chúng ta được

```text
$ gcc main.c -g -o main && ./main
$ Cat ZVQ- $
```

Giờ chúng ta có thể dùng gdb để xem từng byte cụ thể của chuỗi và suy luận xem chương trình lẽ ra phải dừng ở đâu

```text
(gdb) l
1 #include <stdio.h>
2 int main() {
3     char bad_string[3] = {'C', 'a', 't'};
4     printf("%s", bad_string);
5 }
(gdb) b 4
Breakpoint 1 at 0x100000f57: file main.c, line 4.
(gdb) r
[...]
Breakpoint 1, main () at main.c:4
4     printf("%s", bad_string);
(gdb) x/16xb bad_string
0x7fff5fbff9cd: 0x63 0x61 0x74 0xe0 0xf9 0xbf 0x5f 0xff
0x7fff5fbff9d5: 0x7f 0x00 0x00 0xfd 0xb5 0x23 0x89 0xff
(gdb)
```

Ở đây, bằng cách dùng lệnh `x` với tham số `16xb`, chúng ta có thể thấy rằng bắt đầu từ địa chỉ bộ nhớ `0x7fff5fbff9c` (giá trị của `bad_string`), `printf` thực sự sẽ nhìn thấy dãy byte trên như một chuỗi, bởi vì chúng ta đã cung cấp một chuỗi không đúng định dạng, thiếu ký tự kết thúc null.

### 2.4.1 Một ví dụ gdb chi tiết (Involved gdb example)

Đây là cách một TA của bạn sẽ lần lượt gỡ lỗi một chương trình đơn giản đang chạy sai. Trước tiên là mã nguồn của chương trình. Nếu bạn nhìn ra lỗi ngay lập tức, xin hãy kiên nhẫn với chúng tôi.

```c
#include <stdio.h>

double convert_to_radians(int deg);

int main(){
    for (int deg = 0; deg > 360; ++deg){
        double radians = convert_to_radians(deg);
        printf("%d. %f\n", deg, radians);
    }
    return 0;
}

double convert_to_radians(int deg){
    return ( 31415 / 1000 ) * deg / 180;
}
```

Làm sao dùng gdb để gỡ lỗi? Trước hết chúng ta phải nạp GDB.

```text
$ gdb --args ./main
(gdb) layout src; # If you want a GUI type
(gdb) run
(gdb)
```

Muốn xem qua mã nguồn?

```text
(gdb) l
1 #include <stdio.h>
2
3 double convert_to_radians(int deg);
4
5 int main(){
6       for (int deg = 0; deg > 360; ++deg){
7           double radians = convert_to_radians(deg);
8           printf("%d. %f\n", deg, radians);
9       }
10      return 0;
(gdb) break 7 # break <file>:line or break <file>:function
(gdb) run
(gdb)
```

Khi chạy mã, breakpoint thậm chí còn không được kích hoạt, nghĩa là mã chưa bao giờ chạy tới điểm đó. Đó là do phép so sánh! Được rồi, đảo dấu lại là chạy được chứ gì?

```text
(gdb) run
350. 60.000000
351. 60.000000
352. 60.000000
353. 60.000000
354. 60.000000
355. 61.000000
356. 61.000000
357. 61.000000
358. 61.000000
359. 61.000000
```

```text
(gdb) break 14 if deg == 359 # Let's check the last iteration only
(gdb) run
...
(gdb) print/x deg # print the hex value of degree
$1 = 0x167
(gdb) print (31415/1000)
$2 = 0x31
(gdb) print (31415/1000.0)
$3 = 201.749
(gdb) print (31415.0/10000.0)
$4 = 3.1414999999999999
```

Đó mới chỉ là mức tối thiểu, dù phần lớn các bạn sẽ xoay xở được với chừng đó. Có rất nhiều tài nguyên khác trên web, dưới đây là vài tài nguyên cụ thể có thể giúp bạn bắt đầu.

1. Introduction to gdb
2. Memory Content
3. CppCon 2015: Greg Law "Give me 15 minutes & I'll change your view of GDB"

### 2.4.2 Shell

Bạn thực sự dùng gì để chạy chương trình của mình? Một shell! Shell là một ngôn ngữ lập trình đang chạy bên trong terminal của bạn. Terminal chỉ đơn thuần là một cửa sổ để nhập lệnh. Trên POSIX, chúng ta thường có một shell tên là `sh` được liên kết tới một shell tuân thủ POSIX tên là `dash`. Phần lớn thời gian, bạn dùng một shell tên là `bash`, ít nhiều tuân thủ POSIX nhưng có thêm một số tính năng tích hợp tiện lợi. Nếu muốn nâng cao hơn nữa, `zsh` có một số tính năng mạnh hơn như tab complete cho các chương trình và mẫu fuzzy.

### 2.4.3 Undefined Behavior Sanitizer (Bộ kiểm tra hành vi không xác định)

Undefined behavior sanitizer là một công cụ tuyệt vời do dự án llvm cung cấp. Nó cho phép bạn biên dịch mã kèm một bộ kiểm tra lúc chạy để bảo đảm bạn không gây ra undefined behavior thuộc nhiều loại khác nhau. Chúng tôi sẽ cố gắng đưa nó vào các dự án của mình, nhưng nó đòi hỏi sự hỗ trợ từ tất cả các thư viện ngoài mà chúng tôi dùng, nên có thể chúng tôi không kịp làm với tất cả. https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html

**Undefined behavior – vì sao không thể giải quyết nó trong trường hợp tổng quát**

Ngoài ra, xin hãy, xin hãy đọc loạt bài blog 3 phần của Chris Lattner về undefined behavior. Nó có thể soi sáng về các bản build debug và bí ẩn của tối ưu hóa trình biên dịch.
http://blog.llvm.org/2011/05/what-every-c-programmer-should-know.html

### 2.4.4 Các công cụ build tĩnh của Clang (Clang Static Build Tools)

Clang cung cấp những công cụ thay thế trực tiếp (drop-in) tuyệt vời để biên dịch chương trình. Nếu bạn muốn xem có lỗi nào có thể gây ra race condition, lỗi ép kiểu, v.v. hay không, tất cả những gì bạn cần làm là như sau.

```bash
$ scan-build make
```

Và ngoài output của make, bạn sẽ nhận được các cảnh báo build tĩnh.

### 2.4.5 strace và ltrace

`strace` và `ltrace` là hai chương trình theo dõi (trace) lần lượt các system call và các lời gọi thư viện của một chương trình hay lệnh đang chạy. Chúng có thể chưa có trên hệ thống của bạn, nên để cài đặt hãy thoải mái chạy lệnh sau.

```bash
$ sudo apt install strace ltrace
```

Gỡ lỗi với ltrace có thể đơn giản chỉ là tìm ra giá trị trả về của lời gọi thư viện cuối cùng bị thất bại.

```c
int main() {
    FILE *fp = fopen("I don't exist", "r");
    fprintf(fp, "a");
    fclose(fp);
    return 0;
}
```

```text
> ltrace ./a.out
 __libc_start_main(0x8048454, 1, 0xbfc19db4, 0x80484c0, 0x8048530 <unfinished ...>
 fopen("I don't exist", "r")                     = 0x0
 fwrite("Invalid Write\n", 1, 14, 0x0 <unfinished ...>
 --- SIGSEGV (Segmentation fault) ---
 +++ killed by SIGSEGV +++
```

Output của ltrace có thể gợi ý cho bạn về những điều kỳ lạ mà chương trình đang làm ngay lúc chạy. Đáng tiếc, ltrace không thể dùng để tiêm lỗi (inject fault), nghĩa là ltrace có thể cho bạn biết điều gì đang xảy ra, nhưng không thể can thiệp vào những gì đang diễn ra.

strace, ngược lại, có thể sửa đổi chương trình của bạn. Gỡ lỗi với strace thật tuyệt vời. Cách dùng cơ bản là chạy strace với một chương trình, và nó sẽ cho bạn danh sách đầy đủ các tham số của system call.

```text
$ strace head README.md
execve("/usr/bin/head", ["head", "README.md"], 0x7ffff28c8fa8 /* 60 vars */) = 0
brk(NULL)                           = 0x7ffff5719000
access("/etc/ld.so.nohwcap", F_OK) = -1 ENOENT (No such file or directory)
access("/etc/ld.so.preload", R_OK) = -1 ENOENT (No such file or directory)
openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3
fstat(3, {st_mode=S_IFREG|0644, st_size=32804, ...}) = 0
...
```

Nếu output quá dài dòng, bạn có thể dùng `trace=` với một danh sách các syscall phân cách bằng dấu phẩy để lọc bỏ tất cả trừ những lời gọi đó.

```text
$ strace -e trace=read,write head README.md
read(3, "\177ELF\2\1\1\3\0\0\0\0\0\0\0\0\3\0>\0\1\0\0\0\260\34\2\0\0\0\0\0"..., 832) = 832
read(3, "# Locale name alias data base.\n#"..., 4096) = 2995
read(3, "", 4096)                   = 0
read(3, "# C Datastructures\n\n[![Build Sta"..., 8192) = 1250
write(1, "# C Datastructures\n", 19# C Datastructures
```

Bạn cũng có thể theo dõi theo file hoặc mục tiêu cụ thể.

```text
$ strace -e trace=read,write -P README.md head README.md
strace: Requested path 'README.md' resolved into '/mnt/c/Users/user/personal/libds/README.md'
read(3, "# C Datastructures\n\n[![Build Sta"..., 8192) = 1250
```

Các phiên bản strace mới hơn thực sự có thể tiêm lỗi vào chương trình của bạn. Điều này hữu ích khi bạn muốn thỉnh thoảng làm cho các thao tác đọc và ghi thất bại, ví dụ trong một ứng dụng mạng, mà chương trình của bạn cần xử lý được. Vấn đề là, tính đến đầu năm 2019, phiên bản đó chưa có trong kho phần mềm của Ubuntu. Nghĩa là bạn sẽ phải cài từ mã nguồn.

### 2.4.6 printf (printfs)

Khi mọi cách khác đều thất bại, hãy in ra! Mỗi hàm của bạn nên có một ý tưởng rõ ràng về việc nó sẽ làm. Bạn muốn kiểm tra rằng mỗi hàm đang làm đúng việc nó được đặt ra và thấy chính xác mã của bạn hỏng ở đâu. Trong trường hợp race condition, tsan có thể giúp, nhưng việc để mỗi thread in dữ liệu ra tại những thời điểm nhất định có thể giúp bạn nhận diện race condition.

Để các printf trở nên hữu ích, hãy cố gắng có một macro điền vào ngữ cảnh mà printf được gọi – có thể gọi là một câu lệnh log. Một câu lệnh log đơn giản, hữu ích nhưng chưa được kiểm thử có thể như sau. Hãy thử viết một bài kiểm tra và tìm ra điều gì đó đang sai, rồi log trạng thái các biến của bạn.

```c
#include <execinfo.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#include <unistd.h>

// bt is print backtrace
const int num_stack = 10;

int __log(int line, const char *file, int bt, const char *fmt, ...) {
  if (bt) {
    void *raw_trace[num_stack];
    size_t size = backtrace(raw_trace, sizeof(raw_trace) / sizeof(raw_trace[0]));
    char **syms = backtrace_symbols(raw_trace, size);

    for(ssize_t i = 0; i < size; i++) {
      fprintf(stderr, "|%s:%d| %s\n", file, line, syms[i]);
    }
    free(syms);
  }
  int ret = fprintf(stderr, "|%s:%d| ", file, line);
  va_list args;
  va_start(args, fmt);
  ret += vfprintf(stderr, fmt, args);
  va_end(args);
  ret += fprintf(stderr, "\n");
  return ret;
}

#ifdef DEBUG
#define log(...) __log(__LINE__, __FILE__, 0, __VA_ARGS__)
#define bt(...) __log(__LINE__, __FILE__, 1, __VA_ARGS__)
#else
#define log(...)
#define bt(...)
#endif

//Use as log(args like printf) or bt(args like printf) to either log or get backtrace

int main() {
  log("Hello Log");
  bt("Hello Backtrace");
}
```

Rồi dùng cho phù hợp. Hãy xem mục biên dịch và liên kết trong phụ lục nếu bạn có thắc mắc về cách một chương trình C được dịch thành mã máy.

## 2.5 Bài tập về nhà 0 (Homework 0)

```c
// First, can you guess which lyrics have been transformed into this C-like system code?
char q[] = "Do you wanna build a C99 program?";
#define or "go debugging with gdb?"
static unsigned int i = sizeof(or) != strlen(or);
char* ptr = "lathe";
size_t come = fprintf(stdout,"%s door", ptr+2);
int away = ! (int) * "";

int* shared = mmap(NULL, sizeof(int*), PROT_READ | PROT_WRITE, MAP_SHARED | MAP_ANONYMOUS, -1, 0);
munmap(shared,sizeof(int*));

if(!fork()) {
    execlp("man","man","-3","ftell", (char*)0); perror("failed");
}

if(!fork()) {
    execlp("make","make", "snowman", (char*)0);
        execlp("make","make", (char*)0));
}

exit(0);
```

### 2.5.1 Vậy là bạn muốn làm chủ Lập trình hệ thống? Và đạt điểm cao hơn B? (So you want to master System Programming? And get a better grade than B?)

```c
int main(int argc, char** argv) {
    puts("Great! We have plenty of useful resources for you, but it's up to you to");
    puts(" be an active learner and learn how to solve problems and debug code.");
    puts("Bring your near-completed answers the problems below");
    puts(" to the first lab to show that you've been working on this.");
    printf("A few \"don't knows\" or \"unsure\" is fine for lab 1.\n");
    puts("Warning: you and your peers will work hard in this class.");
    puts("This is not CS225; you will be pushed much harder to");
    puts(" work things out on your own.");
    fprintf(stdout,"This homework is a stepping stone to all future assignments.\n");
    char p[] = "So, you will want to clear up any confusions or misconceptions.\n";
    write(1, p, strlen(p) );
    char buffer[1024];
    sprintf(buffer,"For grading purposes, this homework 0 will be graded as part of your lab %d work.\n", 1);
    write(1, buffer, strlen(buffer));
    printf("Press Return to continue\n");
    read(0, buffer, sizeof(buffer));
    return 0;
}
```

*(ND: Chương trình trên in ra lời nhắn, đại ý: "Tuyệt! Chúng tôi có rất nhiều tài nguyên hữu ích cho bạn, nhưng bạn phải chủ động học và tự học cách giải quyết vấn đề, gỡ lỗi mã. Hãy mang các câu trả lời gần hoàn chỉnh cho các bài dưới đây đến buổi lab đầu tiên để cho thấy bạn đã làm việc. Vài câu 'không biết' hay 'không chắc' là chấp nhận được ở lab 1. Cảnh báo: bạn và các bạn học sẽ phải làm việc vất vả trong môn này. Đây không phải CS225; bạn sẽ bị thúc ép tự tìm ra lời giải nhiều hơn hẳn. Bài tập này là bước đệm cho mọi bài tập về sau, nên bạn sẽ muốn làm rõ mọi chỗ còn mơ hồ hay hiểu sai. Về mặt chấm điểm, homework 0 được tính vào điểm lab 1. Nhấn Return để tiếp tục.")*

### 2.5.2 Xem các video và viết câu trả lời cho những câu hỏi sau (Watch the videos and write up your answers to the following questions)

**Quan trọng!**

Máy ảo chạy trong trình duyệt và các video bạn cần cho HW0 nằm ở đây:
http://cs-education.github.io/sys/

Có câu hỏi? Góp ý? Hãy dùng Piazza của CS241 học kỳ hiện tại: https://piazza.com/

Máy ảo trong trình duyệt chạy hoàn toàn bằng JavaScript và nhanh nhất trên Chrome. Lưu ý rằng VM cùng mọi mã bạn viết sẽ bị đặt lại khi bạn tải lại trang, nên hãy chép mã của bạn ra một tài liệu riêng. Các thử thách sau mỗi video không thuộc homework 0, nhưng bạn học được nhiều nhất bằng cách thực hành chứ không phải xem thụ động. Hãy vui vẻ với mỗi thử thách ở cuối video.

Các câu hỏi HW0 ở bên dưới. Hãy chép câu trả lời của bạn vào một tài liệu văn bản vì bạn sẽ cần nộp chúng sau này trong khóa học.

### 2.5.3 Chương 1 (Chapter 1)

Trong đó người hùng gan dạ của chúng ta chiến đấu với standard out, standard error, file descriptor (bộ mô tả tệp) và việc ghi vào file

1. **Hello, World! (kiểu system call)** Viết một chương trình dùng `write()` để in ra "Hi! My name is <Your Name>".
2. **Hello, Standard Error Stream!** Viết một hàm in ra một tam giác chiều cao n ra standard error. Hàm của bạn phải có chữ ký `void write_triangle(int n)` và phải dùng `write()`. Tam giác trông như sau, với n = 3:

    ```text
    *
    **
    ***
    ```

3. **Ghi vào file** Lấy chương trình "Hello, World!" của bạn, sửa để nó ghi vào một file tên là `hello_world.txt`. Hãy chắc chắn dùng đúng các cờ và đúng mode cho `open()` (`man 2 open` là bạn của bạn).
4. **Không phải mọi thứ đều là system call** Lấy chương trình "Ghi vào file" của bạn và thay `write()` bằng `printf()`. Hãy chắc chắn in vào file chứ không phải ra standard out!
5. Một số điểm khác nhau giữa `write()` và `printf()` là gì?

### 2.5.4 Chương 2 (Chapter 2)

Đo kích thước các kiểu trong C và giới hạn của chúng, mảng int và char, và tăng con trỏ

1. Một byte có bao nhiêu bit?
2. Một `char` có bao nhiêu byte?
3. Trên máy của bạn, các kiểu sau chiếm bao nhiêu byte? `int`, `double`, `float`, `long`, và `long long`
4. Trên một máy có số nguyên 8 byte, biến `data` được khai báo là `int data[8]`. Nếu địa chỉ của `data` là `0x7fbd9d40`, thì địa chỉ của `data+2` là gì?
5. `data[3]` tương đương với gì trong C? Gợi ý: C chuyển `data[3]` thành gì trước khi giải tham chiếu địa chỉ? Nhớ rằng kiểu của một hằng chuỗi `"abc"` là một mảng.
6. Tại sao đoạn này bị SEGFAULT?

    ```c
    char *ptr = "hello";
    *ptr = 'J';
    ```

7. Giá trị của biến `str_size` là gì?

    ```c
    ssize_t str_size = sizeof("Hello\0World")
    ```

8. Giá trị của biến `str_len` là gì?

    ```c
    ssize_t str_len = strlen("Hello\0World")
    ```

9. Cho một ví dụ về X sao cho `sizeof(X)` bằng 3.
10. Cho một ví dụ về Y sao cho `sizeof(Y)` có thể là 4 hoặc 8 tùy theo máy.

### 2.5.5 Chương 3 (Chapter 3)

Đối số chương trình, biến môi trường, và làm việc với mảng ký tự (chuỗi)

1. Có ít nhất hai cách nào để tìm độ dài của `argv`?
2. `argv[0]` biểu diễn cái gì?
3. Các con trỏ tới biến môi trường được lưu ở đâu (trên stack, trên heap, hay ở nơi nào khác)?
4. Trên một máy mà con trỏ có kích thước 8 byte, với đoạn mã sau:

    ```c
    char *ptr = "Hello";
    char array[] = "Hello";
    ```

    Giá trị của `sizeof(ptr)` và `sizeof(array)` là gì? Tại sao?

5. Cấu trúc dữ liệu nào quản lý vòng đời của các biến tự động (automatic variable)?

### 2.5.6 Chương 4 (Chapter 4)

Bộ nhớ heap và stack, và làm việc với struct

1. Nếu tôi muốn dùng dữ liệu sau khi vòng đời của hàm tạo ra nó đã kết thúc, tôi nên đặt nó ở đâu? Làm thế nào để đặt nó ở đó?
2. Những điểm khác nhau giữa bộ nhớ heap và stack là gì?
3. Có những loại bộ nhớ nào khác trong một process không?
4. Điền vào chỗ trống: "Trong một chương trình C tốt, ứng với mỗi malloc, có một ___".
5. Một lý do khiến `malloc` có thể thất bại là gì?
6. Một số điểm khác nhau giữa `time()` và `ctime()` là gì?
7. Đoạn mã sau sai ở đâu?

    ```c
    free(ptr);
    free(ptr);
    ```

8. Đoạn mã sau sai ở đâu?

    ```c
    free(ptr);
    printf("%s\n", ptr);
    ```

9. Làm thế nào để tránh hai sai lầm ở trên?
10. Tạo một struct biểu diễn một Person (người). Sau đó tạo một typedef để `struct Person` có thể được thay bằng một từ duy nhất. Một person nên chứa các thông tin sau: tên (một chuỗi), tuổi (một số nguyên), và danh sách bạn bè (lưu dưới dạng con trỏ tới một mảng các con trỏ tới Person).
11. Bây giờ, tạo hai person trên heap, "Agent Smith" và "Sonny Moore", lần lượt 128 và 256 tuổi và là bạn của nhau. Viết các hàm để tạo và hủy một Person (các Person và tên của họ phải nằm trên heap).
12. `create()` nhận một tên và một tuổi. Tên phải được sao chép lên heap. Dùng `malloc` để dành đủ bộ nhớ cho mỗi người có tối đa mười người bạn. Nhớ khởi tạo tất cả các trường (tại sao?).
13. `destroy()` phải giải phóng cả bộ nhớ của struct person lẫn tất cả các thuộc tính của nó được lưu trên heap. Hủy một người phải giữ nguyên vẹn những người khác.

### 2.5.7 Chương 5 (Chapter 5)

Nhập xuất văn bản và phân tích cú pháp bằng getchar, gets, và getline.

1. Những hàm nào có thể dùng để lấy ký tự từ stdin và ghi chúng ra stdout?
2. Nêu một vấn đề với `gets()`.
3. Viết mã phân tích chuỗi "Hello 5 World" và khởi tạo 3 biến thành "Hello", 5, và "World".
4. Cần định nghĩa gì trước khi include `getline()`?
5. Viết một chương trình C in ra nội dung của một file theo từng dòng bằng `getline()`.

### 2.5.8 Phát triển với C (C Development)

Đây là những mẹo chung về biên dịch và phát triển bằng trình biên dịch và git. Tìm kiếm trên web sẽ hữu ích ở đây

1. Cờ biên dịch nào được dùng để tạo một bản build debug?
2. Bạn sửa một vấn đề trong Makefile và gõ `make` lần nữa. Giải thích tại sao việc này có thể không đủ để tạo ra một bản build mới.
3. Tab hay dấu cách được dùng để thụt đầu dòng các lệnh sau một rule trong Makefile?
4. `git commit` làm gì? Một sha trong ngữ cảnh git là gì?
5. `git log` cho bạn thấy gì?
6. `git status` cho bạn biết gì và nội dung của `.gitignore` sẽ thay đổi output của nó như thế nào?
7. `git push` làm gì? Tại sao chỉ commit với `git commit -m 'fixed all bugs'` là không đủ?
8. Lỗi từ chối `git push` kiểu non-fast-forward nghĩa là gì? Cách xử lý phổ biến nhất là gì?

### 2.5.9 Tùy chọn: Chỉ để cho vui (Optional: Just for fun)

- Chuyển lời một bài hát thành mã Lập trình hệ thống và C được đề cập trong cuốn sách wiki này và chia sẻ lên Piazza.
- Tìm, theo ý bạn, đoạn mã C hay nhất và tệ nhất trên web và đăng liên kết lên Piazza.
- Viết một chương trình C ngắn có một lỗi C tinh vi được cài chủ ý và đăng lên Piazza để xem người khác có phát hiện ra lỗi của bạn không.
- Bạn có biết lỗi lập trình hệ thống nào thú vị/thảm họa không? Hãy thoải mái chia sẻ với bạn bè và đội ngũ giảng dạy trên Piazza.

## 2.6 Hướng dẫn riêng cho UIUC (UIUC Specific Guidelines)

### 2.6.1 Piazza

Các TA và trợ giảng sinh viên nhận được cực kỳ nhiều câu hỏi. Một số được nghiên cứu kỹ, một số thì không. Đây là một hướng dẫn tiện dụng giúp bạn rời xa loại thứ hai và tiến về loại thứ nhất. À, tôi đã nói đây cũng là cách dễ dàng để ghi điểm với quản lý thực tập của bạn chưa nhỉ? Hãy tự hỏi...

1. Tôi có đang chạy trên Máy ảo của mình không?
2. Tôi đã xem man page chưa?
3. Tôi đã tìm các câu hỏi/phản hồi tương tự trên Piazza chưa?
4. Tôi đã đọc trọn vẹn đặc tả MP/Lab chưa?
5. Tôi đã xem hết các video chưa?
6. Tôi đã Google thông báo lỗi và vài biến thể của nó nếu cần chưa? Còn StackOverflow thì sao?
7. Tôi đã thử comment bớt, in ra, và/hoặc chạy từng bước qua các phần của mã để tìm ra chính xác lỗi xảy ra ở đâu chưa?
8. Tôi đã commit mã lên git phòng khi TA cần thêm ngữ cảnh chưa?
9. Tôi đã đưa output của console/GDB/Valgrind **VÀ** đoạn mã xung quanh lỗi vào bài đăng Piazza chưa?
10. Tôi đã sửa các segmentation fault khác không liên quan đến vấn đề đang gặp chưa?
11. Tôi có đang tuân theo các thực hành lập trình tốt không? (ví dụ đóng gói, dùng hàm để hạn chế lặp lại, v.v.)

Lời khuyên lớn nhất mà chúng tôi có thể dành cho bạn khi đặt câu hỏi trên Piazza, nếu bạn muốn được trả lời nhanh, là hãy đặt câu hỏi như thể bạn đang cố trả lời nó. Tức là trước khi hỏi, hãy thử tự trả lời. Nếu bạn đang định đăng

> Chào, mã của tôi được 50 điểm

Nghe có vẻ ổn và lịch sự, nhưng đội ngũ giảng dạy sẽ thích hơn rất, rất nhiều một bài đăng kiểu như sau

> Chào, gần đây tôi trượt các test X, Y, Z, chiếm khoảng một nửa số test của bài tập hiện tại. Tôi nhận thấy chúng đều có liên quan đến networking và epoll, nhưng không tìm ra điểm chung liên kết chúng, hoặc có thể tôi hoàn toàn đi sai hướng. Để kiểm tra ý tưởng của mình, tôi đã thử sinh 1000 client với nhiều yêu cầu get và put khác nhau và xác minh rằng các file khớp với bản gốc. Tôi không thể làm nó thất bại khi chạy bình thường, với bản build debug, hay với valgrind hoặc tsan. Tôi không có cảnh báo nào và không kiểm tra tiền cú pháp nào cho tôi thấy gì cả. Thầy/cô có thể cho tôi biết cách hiểu của tôi về lỗi này có đúng không và tôi có thể sửa các bài test của mình thế nào để phản ánh tốt hơn X, Y, Z? netid: bvenkat2

Bạn không cần phải lịch sự đến mức đó, dù chúng tôi sẽ rất trân trọng, nhưng cách này sẽ đem lại thời gian phản hồi nhanh hơn rất nhiều. Nếu bạn là người cố trả lời câu hỏi này, bạn sẽ có mọi thứ cần thiết ngay trong nội dung câu hỏi.

## Tài liệu tham khảo (Bibliography)

[1] assert. URL http://www.cplusplus.com/reference/cassert/assert/.

[2] ssh(1). URL https://man.openbsd.org/ssh.1.

[3] Chapter 3. hardware interrupts. URL https://access.redhat.com/documentation/en-US/Red_Hat_Enterprise_MRG/1.3/html/Realtime_Reference_Guide/chap-Realtime_Reference_Guide-Hardware_interrupts.html.

[4] 4. memcheck: a memory error detector. URL http://valgrind.org/docs/manual/mc-manual.html.

[5] Threadsanitizercppmanual, Dec 2018. URL https://github.com/google/sanitizers/wiki/ThreadSanitizerCppManual.

[6] Gdb: The gnu project debugger, Feb 2019. URL https://www.gnu.org/software/gdb/.

[7] Manu Garg. Sysenter based system call mechanism in linux 2.6, 2006. URL http://articles.manugarg.com/systemcallinlinux2_6.html.

[8] Part Guide. Intel R 64 and ia-32 architectures software developers manual. Volume 3B: System programming Guide, Part, 2, 2011.

[9] CAT Intel. Improving real-time performance by utilizing cache allocation technology. Intel Corporation, April, 2015.

[10] Xavier Leroy. How i found a bug in intel skylake processors, Jul 2017. URL http://gallium.inria.fr/blog/intel-skylake-bug/.

[11] David Levinthal. Performance analysis guide for intel core i7 processor and intel xeon 5500 processors. Intel Performance Analysis Guide, 30:18, 2009.

[12] Hermann Schweizer, Maciej Besta, and Torsten Hoefler. Evaluating the cost of atomic operations on modern architectures. In 2015 International Conference on Parallel Architecture and Compilation (PACT), pages 445–456. IEEE, 2015.

[13] Wikibooks. X86 assembly — wikibooks, the free textbook project, 2018. URL https://en.wikibooks.org/w/index.php?title=X86_Assembly&oldid=3477563. [Online; accessed 19-March-2019].
