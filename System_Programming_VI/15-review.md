# Chương 15. Ôn tập (Review)

> Bản dịch tiếng Việt từ *System Programming Coursebook* (University of Illinois, CS 241) — B. Venkatesh, L. Angrave et al. Tài liệu gốc được phát hành theo giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); bản dịch giữ nguyên giấy phép này. Nguồn: https://github.com/illinois-cs241/coursebook

Dưới đây là một danh sách các chủ đề (không đầy đủ).

## 15.1 C

### 15.1.1 Memory and Strings (Bộ nhớ và chuỗi)

1. Trong ví dụ dưới đây, những biến nào được bảo đảm sẽ in ra giá trị bằng không?

   ```c
   int a;
   static int b;

   void func() {
     static int c;
     int d;
     printf("%d %d %d %d\n",a,b,c,d);
   }
   ```

2. Trong ví dụ dưới đây, những biến nào được bảo đảm sẽ in ra giá trị bằng không?

   ```c
   void func() {
     int* ptr1 = malloc(sizeof(int));
     int* ptr2 = realloc(NULL, sizeof(int));
     int* ptr3 = calloc(1, sizeof(int));
     int* ptr4 = calloc(sizeof(int), 1);

       printf("%d %d %d %d\n",*ptr1,*ptr2,*ptr3,*ptr4);
   }
   ```

3. Hãy giải thích lỗi trong nỗ lực sao chép chuỗi (string) dưới đây.

   ```c
   char* copy(char*src) {
     char*result = malloc( strlen(src) );
     strcpy(result, src);
     return result;
   }
   ```

4. Vì sao nỗ lực sao chép chuỗi dưới đây lúc thì chạy được, lúc thì lỗi?

   ```c
   char* copy(char*src) {
     char*result = malloc( strlen(src) +1 );
     strcat(result, src);
     return result;
   }
   ```

5. Hãy giải thích hai lỗi trong đoạn code sau khi cố sao chép một chuỗi.

   ```c
   char* copy(char*src) {
     char result[sizeof(src)];
     strcpy(result, src);
     return result;
   }
   ```

6. Trong các dòng sau, dòng nào là hợp lệ?

   ```c
   char a[] = "Hello"; strcpy(a, "World");
   char b[] = "Hello"; strcpy(b, "World12345", b);
   char* c = "Hello"; strcpy(c, "World");
   ```

7. Hãy hoàn thành `typedef` con trỏ hàm để khai báo một con trỏ tới một hàm nhận đối số kiểu `void*` và trả về `void*`. Đặt tên kiểu của bạn là `pthread_callback`.

   ```c
   typedef ______________________;
   ```

8. Ngoài các đối số của hàm ra, còn có gì khác được lưu trên ngăn xếp stack của một thread?

9. Hãy hiện thực một phiên bản của `char* strcat(char*dest, const char*src)` chỉ dùng `strcpy`, `strlen` và số học con trỏ (pointer arithmetic).

   ```c
   char* mystrcat(char*dest, const char*src) {

       ? Use strcpy strlen here

       return dest;
   }
   ```

10. Hãy hiện thực một phiên bản của `size_t strlen(const char*)` dùng một vòng lặp và không gọi hàm nào.

    ```c
    size_t mystrlen(const char*s) {

    }
    ```

11. Hãy chỉ ra ba lỗi (bug) trong phần hiện thực `strcpy` sau đây.

    ```c
    char* strcpy(const char* dest, const char* src) {
      while(*src) { *dest++ = *src++; }
      return dest;
    }
    ```

### 15.1.2 Printing (In ấn)

1. Hãy tìm ra hai lỗi!

   ```c
   fprintf("You scored 100%");
   ```

2. Hãy hoàn thiện đoạn code sau để in ra một file. In tên, một dấu phẩy và điểm số vào file `result.txt`.

   ```c
   char* name = .....;
   int score = ......
   FILE *f = fopen("result.txt",_____);
   if(f) {
     _____
   }
   fclose(f);
   ```

3. Làm thế nào để in giá trị của các biến `a`, `mesg`, `val` và `ptr` ra một chuỗi? In `a` dưới dạng số nguyên, `mesg` dưới dạng chuỗi C, `val` dưới dạng số `double`, và `ptr` dưới dạng con trỏ ở dạng thập lục phân (hexadecimal). Bạn có thể giả định rằng `mesg` trỏ tới một chuỗi C ngắn (dưới 50 ký tự). Câu hỏi thưởng: Làm thế nào để đoạn code này chắc chắn hơn (robust) hoặc có khả năng ứng phó tốt hơn?

   ```c
   char* toString(int a, char*mesg, double val, void* ptr) {
     char* result = malloc( strlen(mesg) + 50);
     _____
     return result;
   }
   ```

### 15.1.3 Input parsing (Phân tích cú pháp đầu vào)

1. Vì sao bạn nên kiểm tra giá trị trả về của `sscanf` và `scanf`? Vì sao `gets` lại nguy hiểm?

2. Hãy viết một chương trình hoàn chỉnh dùng `getline`. Bảo đảm chương trình của bạn không rò rỉ bộ nhớ (memory leak).

3. Khi nào bạn dùng `calloc` thay cho `malloc`? Khi nào `realloc` hữu ích?

4. Lập trình viên đã mắc sai lầm gì trong đoạn code sau? Có thể sửa nó bằng cách i) dùng bộ nhớ heap? ii) dùng bộ nhớ toàn cục (global/static)?

   ```c
   static int id;

   char* next_ticket() {
     id ++;
     char result[20];
     sprintf(result,"%d",id);
     return result;
   }
   ```

## 15.2 Processes (Tiến trình)

1. Process là gì?

2. Những thuộc tính nào được mang theo (kế thừa) từ process cha khi `fork`? Còn khi một lời gọi `exec` thành công thì sao?

3. Fork bomb là gì? Làm thế nào để tránh nó?

4. System call `wait` được dùng để làm gì?

5. Zombie là gì? Làm thế nào để tránh chúng?

6. Orphan (tiến trình mồ côi) là gì? Điều gì xảy ra với chúng?

7. Làm thế nào để kiểm tra trạng thái của một process đã thoát?

8. Một khuôn mẫu (pattern) phổ biến của các process là gì?

## 15.3 Memory (Bộ nhớ)

1. Trong C, những lời gọi nào để cấp phát bộ nhớ?

2. Bộ nhớ do `malloc` cấp phát phải được căn chỉnh (align) theo gì? Vì sao điều đó quan trọng?

3. Knuth's Allocation Scheme (sơ đồ cấp phát của Knuth) là gì?

4. Bạn sẽ xử lý một yêu cầu cấp phát trong sơ đồ buddy allocation như thế nào?

5. Free list (danh sách rỗng) là gì?

6. Có những cách khác nhau nào để chèn vào một free list?

7. Ưu điểm và nhược điểm của first fit, worst fit, best fit là gì?

8. Khi nào thì một hiện thực `malloc` tầm thường như dưới đây có thể chấp nhận được?

   ```c
   void *malloc(int size) {
     return (void *)sbrk(size);
   }
   ```

## 15.4 Threading and Synchronization (Luồng và đồng bộ hóa)

1. Thread là gì? Các thread chia sẻ những gì?

2. Làm thế nào để tạo một thread?

3. Ngăn xếp stack cho một thread nằm ở đâu trong bộ nhớ?

4. Mutex là gì? Nó giải quyết vấn đề gì?

5. Condition variable (biến điều kiện) là gì? Nó giải quyết vấn đề gì?

6. Hãy viết một danh sách liên kết (linked list) thread-safe (an toàn với luồng) hỗ trợ chèn đầu (insert front), chèn cuối (back), lấy khỏi đầu (pop front), và lấy khỏi cuối (pop back). Bảo đảm rằng nó không busy wait (chờ bận)!

7. Peterson's Solution cho bài toán critical section (vùng găng) là gì? Còn Dekker's thì sao?

8. Đoạn code sau có thread-safe không? Hãy thiết kế lại đoạn code sau để nó thread-safe. Gợi ý: Một mutex là không cần thiết nếu vùng nhớ chứa thông điệp (message memory) là riêng biệt cho mỗi lời gọi.

   ```c
   static char message[20];
   pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;

   void *format(int v) {
     pthread_mutex_lock(&mutex);
     sprintf(message, ":%d:" ,v);
     pthread_mutex_unlock(&mutex);
     return message;
   }
   ```

9. Trường hợp nào dưới đây có thể để lại một process ở trạng thái đang chạy (running)?

   (a) Trả về (return) từ hàm khởi đầu của pthread trong thread đang chạy cuối cùng.
   (b) Thread ban đầu trả về (return) từ `main`.
   (c) Bất kỳ thread nào gây ra một segmentation fault.
   (d) Bất kỳ thread nào gọi `exit`.
   (e) Gọi `pthread_exit` trong thread `main` trong khi các thread khác vẫn đang chạy.

10. Hãy viết một biểu thức toán học cho số lượng ký tự "W" sẽ được in ra bởi chương trình sau. Giả sử `a`, `b`, `c`, `d` là các số nguyên dương nhỏ. Câu trả lời của bạn có thể dùng một hàm "min" trả về đối số có giá trị nhỏ nhất.

    ```c
    unsigned int a=...,b=...,c=...,d=...;

    void* func(void* ptr) {
      char m = * (char*)ptr;
      if(m == 'P') sem_post(s);
      if(m == 'W') sem_wait(s);
      putchar(m);
      return NULL;
    }

    int main(int argv, char** argc) {
      sem_init(s,0, a);
      while(b--) pthread_create(&tid, NULL, func, "W");
      while(c--) pthread_create(&tid, NULL, func, "P");
      while(d--) pthread_create(&tid, NULL, func, "W");

        pthread_exit(NULL);
        /*Process will finish when all threads have exited */
    }
    ```

11. Hãy hoàn thành đoạn code sau. Đoạn code sau được cho là in ra "A" và "B" xen kẽ nhau. Nó biểu diễn hai thread thay phiên nhau thực thi. Hãy thêm các lời gọi condition variable vào `func` sao cho thread đang chờ không phải liên tục kiểm tra biến `turn`. Câu hỏi: `pthread_cond_broadcast` có cần thiết không, hay `pthread_cond_signal` là đủ?

    ```c
    pthread_cond_t cv = PTHREAD_COND_INITIALIZER;
    pthread_mutex_t m = PTHREAD_MUTEX_INITIALIZER;

    void* turn;

    void* func(void* mesg) {
      while(1) {
        // Add mutex lock and condition variable calls ...

         while(turn == mesg) {
           /* poll again ... Change me - This busy loop burns CPU time! */
         }

         /* Do stuff on this thread */
         puts( (char*) mesg);
         turn = mesg;

        }
        return 0;
    }

    int main(int argc, char** argv){
      pthread_t tid1;
      pthread_create(&tid1, NULL, func, "A");
      func("B"); // no need to create another thread - use the main thread
      return 0;
    }
    ```

12. Hãy xác định các critical section trong đoạn code cho sẵn. Thêm khóa mutex để làm đoạn code thread-safe. Thêm các lời gọi condition variable sao cho `total` không bao giờ trở nên âm hoặc vượt quá 1000. Thay vào đó, lời gọi nên bị chặn (block) cho tới khi an toàn để tiếp tục. Hãy giải thích vì sao `pthread_cond_broadcast` là cần thiết.

    ```c
    int total;
    void add(int value) {
      if(value < 1) return;
      total += value;
    }
    void sub(int value) {
      if(value < 1) return;
      total -= value;
    }
    ```

13. Một cấu trúc dữ liệu không thread-safe có các phương thức `size()`, `enq` và `deq`. Hãy dùng condition variable và khóa mutex để hoàn thành các phiên bản thread-safe, có tính chặn (blocking).

    ```c
    void enqueue(void* data) {
      // should block if the size() would become greater than 256
      enq(data);
    }
    void* dequeue() {
      // should block if size() is 0
      return deq();
    }
    ```

14. Startup của bạn cung cấp dịch vụ lập kế hoạch đường đi (path planning) sử dụng thông tin giao thông mới nhất. Anh thực tập sinh được trả lương quá cao của bạn đã tạo ra một cấu trúc dữ liệu không thread-safe với hai hàm: `shortest` (dùng nhưng không sửa đổi đồ thị) và `set_edge` (sửa đổi đồ thị).

    ```c
    graph_t* create_graph(char* filename); // called once

    // returns a new heap object that is the shortest path from vertex i to j
    path_t* shortest(graph_t* graph, int i, int j);

    // updates edge from vertex i to j
    void set_edge(graph_t* graph, int i, int j, double time);
    ```

    Vì lý do hiệu năng, nhiều thread phải có thể gọi `shortest` cùng một lúc, nhưng đồ thị chỉ có thể được sửa đổi bởi một thread khi không có thread nào khác đang thực thi bên trong `shortest` hoặc `set_edge`.

15. Hãy dùng khóa mutex và condition variable để hiện thực một giải pháp reader-writer (người đọc–người ghi). Một nỗ lực chưa hoàn chỉnh được trình bày dưới đây. Mặc dù nỗ lực này là thread-safe (do đó đủ dùng cho ngày demo!), nó không cho phép nhiều thread tính đường đi ngắn nhất cùng một lúc và sẽ không có đủ thông lượng (throughput).

    ```c
    path_t* shortest_safe(graph_t* graph, int i, int j) {
      pthread_mutex_lock(&m);
      path_t* path = shortest(graph, i, j);
      pthread_mutex_unlock(&m);
      return path;
    }
    void set_edge_safe(graph_t* graph, int i, int j, double dist) {
      pthread_mutex_lock(&m);
      set_edge(graph, i, j, dist);
      pthread_mutex_unlock(&m);
    }
    ```

16. Có bao nhiêu trong số các phát biểu sau là đúng đối với bài toán reader-writer?

    - Có thể có nhiều reader đang hoạt động (active).
    - Có thể có nhiều writer đang hoạt động.
    - Khi có một writer đang hoạt động thì số reader đang hoạt động phải bằng không.
    - Nếu có một reader đang hoạt động thì số writer đang hoạt động phải bằng không.
    - Một writer phải chờ cho tới khi các reader đang hoạt động hiện tại đã hoàn thành.

## 15.5 Deadlock (Bế tắc)

1. Mỗi điều kiện trong các Coffman condition (điều kiện Coffman) là gì và chúng có nghĩa là gì? Bạn có thể đưa ra định nghĩa của từng điều kiện và một ví dụ về việc phá vỡ chúng bằng mutex không?

2. Hãy đưa ra một ví dụ đời thực về việc phá vỡ lần lượt từng Coffman condition. Một tình huống để suy ngẫm: Thợ sơn (Painters), sơn (paint) và cọ sơn (paint brushes).

   (a) Hold and wait (giữ và chờ)
   (b) Circular wait (chờ vòng tròn)
   (c) No preemption (không có chiếm quyền)
   (d) Mutual exclusion (loại trừ tương hỗ)

3. Hãy xác định khi nào đoạn code Dining Philosophers (Bữa ăn tối của các triết gia) gây ra deadlock (hoặc không). Ví dụ, nếu bạn thấy đoạn code sau thì điều kiện Coffman nào không được thỏa mãn?

   ```c
   // Get both locks or none.
   pthread_mutex_lock( a );
   if( pthread_mutex_trylock( b ) ) { /*failed*/
     pthread_mutex_unlock( a );
     ...
   }
   ```

4. Có bao nhiêu process bị chặn (blocked)?

   - P1 giành được R1
   - P2 giành được R2
   - P1 giành được R3
   - P2 chờ R3
   - P3 giành được R5
   - P1 giành được R4
   - P3 chờ R1
   - P4 chờ R5
   - P5 chờ R1

5. Ưu điểm và nhược điểm của các giải pháp sau đây cho Dining Philosophers là gì?

   (a) Arbitrator (trọng tài)
   (b) Dijkstra
   (c) Stalling's
   (d) Trylock

## 15.6 IPC

1. Những thứ sau đây là gì và mục đích của chúng là gì?

   (a) Translation Lookaside Buffer (TLB)
   (b) Physical Address (địa chỉ vật lý)
   (c) Memory Management Unit (MMU)
   (d) The dirty bit (bit "bẩn")

2. Làm thế nào để xác định số bit được dùng trong page offset (độ dời trong trang)?

3. 20 ms sau một context switch, TLB chứa toàn bộ các địa chỉ logic được dùng bởi đoạn code tính toán số học của bạn, vốn truy cập bộ nhớ chính (main memory) 100% thời gian. Overhead (mức làm chậm) của một bảng trang hai cấp (two-level page table) so với một bảng trang một cấp (single-level page table) là bao nhiêu?

4. Hãy giải thích vì sao TLB phải được xả (flush) khi một context switch xảy ra (tức là khi CPU được giao làm việc cho một process khác).

5. Hãy điền vào chỗ trống để chương trình sau in ra 123456789. Nếu `cat` không được cho đối số nào thì nó chỉ đơn giản in đầu vào của nó cho tới khi gặp EOF. Câu hỏi thưởng: Hãy giải thích vì sao lời gọi `close` bên dưới là cần thiết.

   ```c
   int main() {
     int i = 0;
     while(++i < 10) {
       pid_t pid = fork();
        if(pid == 0) { /* child */
          char buffer[16];
          sprintf(buffer, ______,i);
          int fds[ ______];
          pipe(fds);
          write(fds[1], ______,______ ); // Write the buffer into the pipe
          close(______);
          dup2(fds[0], ______);
          execlp("cat", "cat", ______);
          perror("exec"); exit(1);
        }
        waitpid(pid, NULL, 0);
      }
      return 0;
   }
   ```

6. Hãy dùng các lời gọi POSIX `fork`, `pipe`, `dup2` và `close` để hiện thực một chương trình chấm bài tự động (autograding). Bắt (capture) đầu ra chuẩn (standard output) của một process con vào một pipe. Process con nên `exec` chương trình `./test` mà không có đối số bổ sung nào (ngoài tên process). Trong process cha, đọc từ pipe: Thoát process cha ngay khi đầu ra đã bắt được có chứa ký tự `!`. Trước khi thoát process cha, gửi `SIGKILL` tới process con. Thoát với mã 0 nếu đầu ra có chứa `!`. Ngược lại, nếu process con thoát làm cho đầu ghi (write end) của pipe bị đóng, thì thoát với giá trị 1. Hãy chắc chắn đóng các đầu không dùng của pipe trong cả process cha lẫn process con.

7. Thử thách nâng cao này dùng pipe để khiến một "AI player" (người chơi AI) tự chơi với chính nó cho tới khi ván đấu kết thúc. Chương trình `tic tac toe` (cờ ca-rô) nhận một dòng đầu vào — chuỗi các nước đi đã thực hiện cho tới lúc đó, in ra chính chuỗi đó theo sau bởi một nước đi khác, rồi thoát. Một nước đi được chỉ định bằng hai ký tự. Ví dụ, "A1" và "C3" là hai vị trí góc đối diện nhau. Chuỗi `B2A1A3` là một ván gồm 3 lượt/nước (turns/plys). Một phản hồi hợp lệ là `B2A1A3C1` (nước đi C1 chặn mối đe dọa theo đường chéo B2 A3). Dòng đầu ra cũng có thể bao gồm một hậu tố `-I win`, `-You win`, `-invalid` hoặc `-draw`. Hãy dùng pipe để điều khiển đầu vào và đầu ra của mỗi process con được tạo ra. Khi đầu ra chứa một dấu `-`, hãy in dòng đầu ra cuối cùng (toàn bộ chuỗi ván đấu và kết quả) rồi thoát.

8. Hãy viết một hàm dùng `fseek` và `ftell` để thay thế ký tự ở giữa của một file bằng ký tự 'X'.

   ```c
   void xout(char* filename) {
     FILE *f = fopen(filename, ____ );

       // Your code here ...
   }
   ```

9. MMU là gì? Nhược điểm của việc dùng nó so với một hệ thống bộ nhớ trực tiếp (direct memory system) là gì?

10. Pipe là gì?

11. Ưu điểm và nhược điểm giữa named pipe (pipe có tên) và unnamed pipe (pipe không tên) là gì?

## 15.7 Filesystems (Hệ thống tệp)

1. File API là gì?

2. Tên của các file được lưu ở đâu?

3. Trong một inode chứa những gì?

4. Hai tên file đặc biệt trong mọi thư mục là gì?

5. Bạn phân giải (resolve) đường dẫn sau như thế nào: `a/../b/./c/../../c`

6. Các nhóm `rwx` là gì?

7. UID là gì? GID là gì? Sự khác nhau giữa UID và Effective UID (UID hiệu lực) là gì?

8. `umask` là gì?

9. Sticky bit là gì?

10. Virtual file system (hệ thống tệp ảo) là gì?

11. RAID là gì?

12. Trong một hệ thống tệp ext2, có bao nhiêu inode phải được đọc từ đĩa để truy cập byte đầu tiên của file `/dir1/subdirA/notes.txt`? Giả sử tên các thư mục và số inode trong thư mục gốc (root directory) — nhưng không phải bản thân các inode — đã có sẵn trong bộ nhớ.

13. Trong một hệ thống tệp ext2, số khối đĩa (disk block) tối thiểu phải được đọc từ đĩa để truy cập byte đầu tiên của file `/dir1/subdirA/notes.txt` là bao nhiêu? Giả sử tên các thư mục và số inode trong thư mục gốc, cùng tất cả các inode, đã có sẵn trong bộ nhớ.

14. Trong một hệ thống tệp ext2 với địa chỉ 32 bit và khối đĩa 4KiB, một inode có thể lưu 10 số khối đĩa trực tiếp (direct disk block number). Kích thước file tối thiểu để cần đến i) một bảng gián tiếp đơn (single indirection table)? ii) một bảng gián tiếp kép (double indirection table)?

15. Hãy sửa lệnh shell `chmod` bên dưới để đặt quyền cho file `secret.txt` sao cho chủ sở hữu (owner) có quyền đọc, ghi và thực thi (read, write, execute), nhóm (group) có quyền đọc, và tất cả những người còn lại không có quyền truy cập.

    ```bash
    $ chmod 000 secret.txt
    ```

## 15.8 Networking (Mạng)

1. Socket là gì?

2. Các tầng (layer) khác nhau của internet là gì?

3. IP là gì? Một địa chỉ IP là gì?

4. TCP là gì? UDP là gì? Sự khác nhau là gì?

5. Hãy tạo một TCP client gửi "Hello" tới một server.

6. Hãy tạo một TCP echo server đơn giản. Đây là một server đọc các byte từ một client cho tới khi client đóng kết nối, và dội (echo) các byte đó trở lại client.

7. Hãy tạo một UDP client gửi một loạt (flood) các gói tin tới một hostname ở `argv[1]`.

8. HTTP là gì?

9. DNS là gì?

10. Vì sao chúng ta dùng IO không chặn (non-blocking IO) cho mạng?

11. RPC là gì?

12. Có gì đặc biệt khi lắng nghe (listen) trên cổng (port) 1000 so với cổng 2000?

    - Cổng 2000 chậm gấp đôi cổng 1000.
    - Cổng 2000 nhanh gấp đôi cổng 1000.
    - Cổng 1000 yêu cầu quyền root (root privileges).
    - Không có gì.

13. Hãy mô tả một điểm khác biệt đáng kể giữa IPv4 và IPv6?

14. Khi nào và vì sao bạn dùng `ntohs`?

15. Nếu một địa chỉ host dài 32 bit thì nhiều khả năng tôi đang dùng sơ đồ IP nào? Còn 128 bit thì sao?

16. Giao thức mạng phổ biến nào là dựa trên gói tin (packet based) và có thể không chuyển giao dữ liệu thành công?

17. Giao thức phổ biến nào là dựa trên luồng (stream-based) và sẽ gửi lại dữ liệu nếu các gói tin bị mất?

18. SYN ACK ACK-SYN handshake (bắt tay) là gì?

19. Điều nào sau đây KHÔNG phải là một tính năng của TCP?

    (a) Sắp xếp lại gói tin (Packet reordering)
    (b) Kiểm soát luồng (Flow control)
    (c) Truyền lại gói tin (Packet retransmission)
    (d) Phát hiện lỗi đơn giản (Simple error detection)
    (e) Mã hóa (Encryption)

20. Giao thức nào dùng số thứ tự (sequence number)? Giá trị ban đầu của chúng là gì? Và vì sao?

21. Các network call tối thiểu cần thiết để xây dựng một TCP server là gì? Thứ tự đúng của chúng là gì?

22. Các network call tối thiểu cần thiết để xây dựng một TCP client là gì? Thứ tự đúng của chúng là gì?

23. Khi nào bạn gọi `bind` trên một TCP client?

24. Mục đích của `socket`, `bind`, `listen`, `accept` là gì?

25. Trong các lời gọi trên, lời gọi nào có thể chặn (block), chờ một client mới kết nối?

26. DNS là gì? Nó làm gì cho bạn? Trong các network call của CS241, lời gọi nào sẽ dùng nó thay cho bạn?

27. Với `getaddrinfo`, làm thế nào để bạn chỉ định một server socket?

28. Vì sao `getaddrinfo` có thể sinh ra các gói tin mạng?

29. Network call nào chỉ định kích thước của backlog cho phép?

30. Network call nào trả về một file descriptor mới?

31. Khi nào các passive socket (socket thụ động) được dùng?

32. Khi nào `epoll` là lựa chọn tốt hơn `select`? Khi nào `select` là lựa chọn tốt hơn `epoll`?

33. `write(fd, data, 5000)` có luôn gửi 5000 byte dữ liệu không? Khi nào nó có thể thất bại?

34. Network Address Translation (NAT) hoạt động như thế nào?

35. Giả sử một mạng có One Way Transit Time (thời gian truyền một chiều) là 20ms giữa Client và Server, sẽ mất bao nhiêu thời gian để thiết lập một kết nối TCP?

    (a) 20ms
    (b) 40ms
    (c) 100ms
    (d) 60ms

36. Một số điểm khác biệt giữa HTTP 1.0 và HTTP 1.1 là gì? Sẽ mất bao nhiêu ms để truyền 3 file từ server tới client nếu mạng có thời gian truyền 20ms? Thời gian cần thiết khác nhau như thế nào giữa HTTP 1.0 và HTTP 1.1?

37. Việc ghi vào một network socket có thể không gửi được tất cả các byte và có thể bị gián đoạn do một tín hiệu (signal). Hãy kiểm tra giá trị trả về của `write` để hiện thực `write_all`, hàm này sẽ liên tục gọi `write` với bất kỳ dữ liệu nào còn lại. Nếu `write` trả về -1 thì trả về -1 ngay lập tức, trừ khi `errno` là `EINTR` — trong trường hợp đó lặp lại lần ghi vừa rồi. Bạn sẽ cần dùng số học con trỏ (pointer arithmetic).

    ```c
    // Returns -1 if write fails (unless EINTR in which case it recalls write
    // Repeated calls write until all of the buffer is written.
    ssize_t write_all(int fd, const char *buf, size_t nbyte) {
      ssize_t nb = write(fd, buf, nbyte);
      return nb;
    }
    ```

38. Hãy hiện thực một TCP server đa luồng (multithreaded) lắng nghe trên cổng 2000. Mỗi thread nên đọc 128 byte từ file descriptor của client và dội (echo) chúng trở lại client, trước khi đóng kết nối và kết thúc thread.

39. Hãy hiện thực một UDP server lắng nghe trên cổng 2000. Dành riêng (reserve) một bộ đệm 200 byte. Lắng nghe một gói tin đến. Các gói tin hợp lệ có kích thước 200 byte trở xuống và bắt đầu bằng bốn byte 0x65 0x66 0x67 0x68. Bỏ qua các gói tin không hợp lệ. Với các gói tin hợp lệ, cộng giá trị của byte thứ năm (dưới dạng giá trị không dấu — unsigned) vào một tổng đang chạy (running total) và in ra tổng cho tới thời điểm đó. Nếu tổng đang chạy lớn hơn 255 thì thoát.

## 15.9 Security (Bảo mật)

1. Ba thước đo (measure) cho an toàn dữ liệu (data security) là gì?

2. Stack smashing là gì?

3. Buffer overflow là gì?

4. Một hệ điều hành cung cấp bảo mật như thế nào? Một số ví dụ từ Networking và Filesystems là gì?

5. TCP cung cấp những tính năng bảo mật nào?

6. DNS có an toàn không?

## 15.10 Signals (Tín hiệu)

1. Hãy nêu tên hai tín hiệu (signal) thường được sinh ra bởi kernel.

2. Hãy nêu tên một tín hiệu không thể bị bắt (catch) bởi một signal handler.

3. Vì sao gọi bất kỳ hàm nào (một hàm không phải là signal-handler-safe — an toàn với hàm xử lý tín hiệu) trong một signal handler lại không an toàn?

4. Hãy viết đoạn code ngắn dùng `SIGACTION` và một `SIGNALSET` để tạo một handler cho `SIGALRM`.

5. Sự khác nhau giữa disposition (cách xử lý tín hiệu), mask (mặt nạ), và pending signal set (tập tín hiệu đang chờ) là gì?

6. Những thuộc tính nào được truyền sang cho các process con? Còn các process được `exec` (executed processes) thì sao?
