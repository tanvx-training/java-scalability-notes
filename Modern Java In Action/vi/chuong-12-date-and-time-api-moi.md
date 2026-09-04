# Chương 12. Date and Time API mới

> **Nội dung chương này**
>
> - Vì sao chúng ta cần một thư viện date and time mới, được giới thiệu trong Java 8
> - Biểu diễn ngày và giờ cho cả con người lẫn máy tính
> - Định nghĩa một lượng thời gian (amount of time)
> - Thao tác, định dạng và phân tích cú pháp (parse) các ngày tháng
> - Làm việc với các time zone và các hệ lịch khác nhau

Java API bao gồm rất nhiều thành phần hữu ích giúp bạn xây dựng các ứng dụng phức tạp. Đáng tiếc là Java API không phải lúc nào cũng hoàn hảo. Chúng tôi tin rằng đa số các lập trình viên Java giàu kinh nghiệm sẽ đồng ý rằng phần hỗ trợ ngày và giờ trước Java 8 còn khá xa mới đạt mức lý tưởng. Tuy nhiên, bạn đừng lo lắng; Java 8 giới thiệu một Date and Time API hoàn toàn mới để giải quyết vấn đề này.

Trong Java 1.0, hỗ trợ duy nhất cho ngày và giờ là lớp `java.util.Date`. Bất chấp cái tên của nó, lớp này không biểu diễn một ngày, mà biểu diễn một thời điểm với độ chính xác đến millisecond. Tệ hơn nữa, tính khả dụng của lớp này bị tổn hại bởi một vài quyết định thiết kế mơ hồ, chẳng hạn như lựa chọn về offset của nó: năm bắt đầu đếm từ 1900, trong khi tháng lại bắt đầu từ chỉ số 0. Nếu bạn muốn biểu diễn ngày phát hành của Java 9, tức ngày 21 tháng 9 năm 2017, bạn sẽ phải tạo một instance của `Date` như sau:

```java
Date date = new Date(117, 8, 21);
```

In ngày này ra sẽ cho kết quả, đối với các tác giả, là:

```text
Thu Sep 21 00:00:00 CET 2017
```

Không mấy trực quan, phải không? Hơn nữa, ngay cả chuỗi String trả về từ phương thức `toString` của lớp `Date` cũng có thể gây khá nhiều hiểu lầm. Nó còn bao gồm cả time zone mặc định của JVM, CET, tức là Central Europe Time trong trường hợp của chúng tôi. Thật vậy, bản thân lớp `Date` chỉ đơn thuần chèn time zone mặc định của JVM vào mà thôi!

Các vấn đề và hạn chế của lớp `Date` đã lộ rõ ngay khi Java 1.0 ra mắt, nhưng cũng rõ ràng rằng những vấn đề đó không thể được sửa mà không phá vỡ tính tương thích ngược (backward compatibility) của nó. Hệ quả là, trong Java 1.1 nhiều phương thức của lớp `Date` bị đánh dấu deprecated, và lớp này được thay thế bằng lớp thay thế `java.util.Calendar`.

Đáng tiếc, `Calendar` cũng có những vấn đề và khiếm khuyết thiết kế tương tự, dẫn đến code dễ sinh lỗi. Tháng cũng bắt đầu từ chỉ số 0. (Ít nhất thì `Calendar` đã loại bỏ được offset 1900 cho năm.) Tệ hơn, sự tồn tại đồng thời của cả hai lớp `Date` và `Calendar` càng làm tăng sự bối rối cho lập trình viên. (Nên dùng lớp nào đây?) Ngoài ra, những tính năng như `DateFormat`, được dùng để định dạng và parse ngày hoặc giờ theo cách độc lập ngôn ngữ, lại chỉ hoạt động với lớp `Date`.

Bản thân `DateFormat` cũng đi kèm hàng loạt vấn đề riêng. Chẳng hạn, nó không thread-safe, nghĩa là nếu hai thread cùng cố parse một ngày bằng cùng một formatter tại cùng một thời điểm, bạn có thể nhận về những kết quả không thể đoán trước.

Cuối cùng, cả `Date` lẫn `Calendar` đều là các lớp mutable. Việc "biến đổi" (mutate) ngày 21 tháng 9 năm 2017 thành ngày 25 tháng 10 thì có ý nghĩa gì? Lựa chọn thiết kế này có thể đẩy bạn vào một cơn ác mộng bảo trì, như bạn sẽ tìm hiểu chi tiết hơn trong chương 18, chương nói về functional programming.

Hệ quả là tất cả những khiếm khuyết và thiếu nhất quán này đã khuyến khích việc sử dụng các thư viện date and time của bên thứ ba, chẳng hạn như Joda-Time. Vì những lý do đó, Oracle quyết định cung cấp phần hỗ trợ ngày và giờ chất lượng cao ngay trong Java API gốc. Kết quả là Java 8 tích hợp nhiều tính năng của Joda-Time vào package `java.time`.

Trong chương này, chúng ta khám phá các tính năng do Date and Time API mới giới thiệu. Chúng ta bắt đầu với những trường hợp sử dụng cơ bản như tạo các ngày và giờ phù hợp để dùng cho cả con người lẫn máy tính. Sau đó chúng ta dần dần khám phá những ứng dụng nâng cao hơn của Date and Time API mới, chẳng hạn như thao tác, parse và in ra các đối tượng date-time, cùng với việc làm việc với các time zone khác nhau và các hệ lịch thay thế.

## 12.1. LocalDate, LocalTime, LocalDateTime, Instant, Duration và Period

Chúng ta bắt đầu bằng việc khám phá cách tạo các ngày và các khoảng thời gian đơn giản. Package `java.time` bao gồm nhiều lớp mới giúp bạn làm việc này: `LocalDate`, `LocalTime`, `LocalDateTime`, `Instant`, `Duration` và `Period`.

### 12.1.1. Làm việc với LocalDate và LocalTime

Lớp `LocalDate` có lẽ là lớp đầu tiên bạn gặp khi bắt đầu sử dụng Date and Time API mới. Một instance của lớp này là một đối tượng immutable biểu diễn một ngày thuần tuý, không kèm theo thời gian trong ngày. Đặc biệt, nó không mang bất kỳ thông tin nào về time zone.

Bạn có thể tạo một instance `LocalDate` bằng cách dùng static factory method `of`. Một instance `LocalDate` cung cấp nhiều phương thức để đọc các giá trị được dùng phổ biến nhất của nó (năm, tháng, thứ trong tuần, v.v.), như minh hoạ trong listing dưới đây.

**Listing 12.1. Tạo một LocalDate và đọc các giá trị của nó**

```java
LocalDate date = LocalDate.of(2017, 9, 21);   // 2017-09-21
int year = date.getYear();                    // 2017
Month month = date.getMonth();                // SEPTEMBER
int day = date.getDayOfMonth();               // 21
DayOfWeek dow = date.getDayOfWeek();          // THURSDAY
int len = date.lengthOfMonth();               // 30 (số ngày trong tháng Chín)
boolean leap = date.isLeapYear();             // false (không phải năm nhuận)
```

Bạn cũng có thể lấy ngày hiện tại từ đồng hồ hệ thống bằng factory method `now`:

```java
LocalDate today = LocalDate.now();
```

Tất cả các lớp date-time khác mà chúng ta khảo sát trong phần còn lại của chương này đều cung cấp một factory method tương tự. Bạn cũng có thể truy cập cùng thông tin đó bằng cách truyền một `TemporalField` vào phương thức `get`. `TemporalField` là một interface định nghĩa cách truy cập giá trị của một trường cụ thể trên một đối tượng temporal. Enum `ChronoField` cài đặt interface này, vì vậy bạn có thể tiện lợi dùng một phần tử của enum đó với phương thức `get`, như trong listing kế tiếp.

**Listing 12.2. Đọc các giá trị của LocalDate bằng TemporalField**

```java
int year = date.get(ChronoField.YEAR);
int month = date.get(ChronoField.MONTH_OF_YEAR);
int day = date.get(ChronoField.DAY_OF_MONTH);
```

Bạn có thể dùng các phương thức có sẵn `getYear()`, `getMonthValue()` và `getDayOfMonth()` dưới dạng dễ đọc hơn để truy cập các thông tin đó như sau:

```java
int year = date.getYear();
int month = date.getMonthValue();
int day = date.getDayOfMonth();
```

Tương tự, thời gian trong ngày, chẳng hạn 13:45:20, được biểu diễn bằng lớp `LocalTime`. Bạn có thể tạo các instance của `LocalTime` bằng hai static factory method nạp chồng (overload) cùng tên `of`. Phương thức thứ nhất nhận vào giờ và phút, còn phương thức thứ hai nhận thêm cả giây. Giống như lớp `LocalDate`, lớp `LocalTime` cung cấp một số phương thức getter để truy cập các giá trị của nó, như minh hoạ trong listing dưới đây.

**Listing 12.3. Tạo một LocalTime và đọc các giá trị của nó**

```java
LocalTime time = LocalTime.of(13, 45, 20);   // 13:45:20
int hour = time.getHour();                   // 13
int minute = time.getMinute();               // 45
int second = time.getSecond();               // 20
```

Bạn có thể tạo cả `LocalDate` lẫn `LocalTime` bằng cách parse một String biểu diễn chúng. Để làm việc này, hãy dùng các phương thức static `parse` của chúng:

```java
LocalDate date = LocalDate.parse("2017-09-21");
LocalTime time = LocalTime.parse("13:45:20");
```

Bạn cũng có thể truyền một `DateTimeFormatter` vào phương thức `parse`. Một instance của lớp này quy định cách định dạng một đối tượng ngày và/hoặc giờ. Nó được thiết kế để thay thế lớp `java.util.DateFormat` cũ mà chúng ta đã đề cập trước đó. Chúng tôi sẽ trình bày chi tiết hơn cách sử dụng `DateTimeFormatter` trong mục 12.2.2. Cũng lưu ý rằng cả hai phương thức `parse` này đều ném ra `DateTimeParseException`, vốn kế thừa `RuntimeException`, trong trường hợp đối số String không thể được parse thành một `LocalDate` hoặc `LocalTime` hợp lệ.

### 12.1.2. Kết hợp một ngày và một giờ

Lớp tổng hợp có tên `LocalDateTime` ghép một `LocalDate` với một `LocalTime`. Nó biểu diễn cả ngày lẫn giờ nhưng không kèm time zone, và có thể được tạo trực tiếp hoặc bằng cách kết hợp một ngày với một giờ, như minh hoạ trong listing dưới đây.

**Listing 12.4. Tạo một LocalDateTime trực tiếp hoặc bằng cách kết hợp một ngày và một giờ**

```java
// 2017-09-21T13:45:20
LocalDateTime dt1 = LocalDateTime.of(2017, Month.SEPTEMBER, 21, 13, 45, 20);
LocalDateTime dt2 = LocalDateTime.of(date, time);
LocalDateTime dt3 = date.atTime(13, 45, 20);
LocalDateTime dt4 = date.atTime(time);
LocalDateTime dt5 = time.atDate(date);
```

Lưu ý rằng bạn có thể tạo một `LocalDateTime` bằng cách truyền một giờ cho một `LocalDate` hoặc truyền một ngày cho một `LocalTime`, lần lượt dùng các phương thức `atTime` hoặc `atDate` của chúng. Bạn cũng có thể trích xuất thành phần `LocalDate` hoặc `LocalTime` từ một `LocalDateTime` bằng các phương thức `toLocalDate` và `toLocalTime`:

```java
LocalDate date1 = dt1.toLocalDate();   // 2017-09-21
LocalTime time1 = dt1.toLocalTime();   // 13:45:20
```

### 12.1.3. Instant: ngày và giờ dành cho máy tính

Là con người, chúng ta quen suy nghĩ về ngày và giờ theo tuần, ngày, giờ và phút. Tuy nhiên, cách biểu diễn này lại không dễ để máy tính xử lý. Từ góc nhìn của máy, định dạng tự nhiên nhất để mô hình hoá thời gian là một con số lớn duy nhất biểu diễn một điểm trên một trục thời gian liên tục. Cách tiếp cận này được sử dụng bởi lớp mới `java.time.Instant`, vốn biểu diễn số giây đã trôi qua kể từ mốc Unix epoch time, được quy ước là nửa đêm ngày 1 tháng 1 năm 1970 UTC.

Bạn có thể tạo một instance của lớp này bằng cách truyền số giây vào static factory method `ofEpochSecond` của nó. Ngoài ra, lớp `Instant` hỗ trợ độ chính xác đến nanosecond. Một phiên bản nạp chồng bổ sung của static factory method `ofEpochSecond` nhận thêm đối số thứ hai là phần điều chỉnh nanosecond cho số giây đã truyền vào. Phiên bản nạp chồng này điều chỉnh đối số nanosecond sao cho phần nanosecond được lưu trữ luôn nằm trong khoảng từ 0 đến 999.999.999. Kết quả là, những lời gọi sau đây tới factory method `ofEpochSecond` trả về đúng cùng một `Instant`:

```java
Instant.ofEpochSecond(3);
Instant.ofEpochSecond(3, 0);

// Một tỷ nanosecond (1 giây) sau mốc 2 giây
Instant.ofEpochSecond(2, 1_000_000_000);
// Một tỷ nanosecond (1 giây) trước mốc 4 giây
Instant.ofEpochSecond(4, -1_000_000_000);
```

Như bạn đã thấy với `LocalDate` và các lớp date-time đọc được bởi con người khác, lớp `Instant` cũng hỗ trợ một static factory method khác tên là `now`, cho phép bạn ghi lại một dấu thời gian (timestamp) của thời điểm hiện tại. Cần nhấn mạnh lại rằng `Instant` chỉ được thiết kế để máy tính sử dụng. Nó chỉ gồm một số giây và một số nanosecond. Hệ quả là, nó không cung cấp bất kỳ khả năng nào để xử lý những đơn vị thời gian có ý nghĩa với con người. Một câu lệnh như

```java
int day = Instant.now().get(ChronoField.DAY_OF_MONTH);
```

sẽ ném ra một ngoại lệ như sau:

```text
java.time.temporal.UnsupportedTemporalTypeException: Unsupported field
     DayOfMonth
```

Nhưng bạn có thể làm việc với các `Instant` bằng cách dùng các lớp `Duration` và `Period`, mà chúng ta sẽ xem xét ngay sau đây.

### 12.1.4. Định nghĩa một Duration hoặc một Period

Tất cả các lớp bạn đã thấy cho tới giờ đều cài đặt interface `Temporal`, vốn định nghĩa cách đọc và thao tác các giá trị của một đối tượng mô hình hoá một điểm thời gian tổng quát. Chúng tôi đã chỉ cho bạn vài cách tạo các instance `Temporal` khác nhau. Bước tiếp theo tự nhiên là tạo ra một khoảng thời lượng (duration) giữa hai đối tượng temporal. Static factory method `between` của lớp `Duration` phục vụ đúng mục đích này. Bạn có thể tạo một duration giữa hai `LocalTime`, hai `LocalDateTime` hoặc hai `Instant` như sau:

```java
Duration d1 = Duration.between(time1, time2);
Duration d1 = Duration.between(dateTime1, dateTime2);
Duration d2 = Duration.between(instant1, instant2);
```

Bởi vì `LocalDateTime` và `Instant` được tạo ra cho những mục đích khác nhau, một cái dành cho con người và cái kia dành cho máy tính, nên bạn không được phép trộn lẫn chúng. Nếu bạn cố tạo một duration giữa chúng, bạn sẽ chỉ nhận được một `DateTimeException`. Hơn nữa, vì lớp `Duration` được dùng để biểu diễn một lượng thời gian đo bằng giây và cuối cùng là nanosecond, nên bạn không thể truyền một `LocalDate` vào phương thức `between`.

Khi bạn cần mô hình hoá một lượng thời gian theo năm, tháng và ngày, bạn có thể dùng lớp `Period`. Bạn có thể tìm ra chênh lệch giữa hai `LocalDate` bằng factory method `between` của lớp đó:

```java
Period tenDays = Period.between(LocalDate.of(2017, 9, 11),
                               LocalDate.of(2017, 9, 21));
```

Cuối cùng, các lớp `Duration` và `Period` còn có những factory method tiện lợi khác để tạo trực tiếp các instance của chúng, mà không cần định nghĩa chúng như là chênh lệch giữa hai đối tượng temporal, như minh hoạ trong listing dưới đây.

**Listing 12.5. Tạo các Duration và Period**

```java
Duration threeMinutes = Duration.ofMinutes(3);
Duration threeMinutes = Duration.of(3, ChronoUnit.MINUTES);
Period tenDays = Period.ofDays(10);
Period threeWeeks = Period.ofWeeks(3);
Period twoYearsSixMonthsOneDay = Period.of(2, 6, 1);
```

Các lớp `Duration` và `Period` chia sẻ nhiều phương thức tương tự nhau, được liệt kê trong bảng 12.1.

**Bảng 12.1. Các phương thức chung của những lớp date-time biểu diễn một khoảng thời gian**

| Phương thức | Static | Mô tả |
|---|---|---|
| `between` | Có | Tạo một khoảng giữa hai điểm thời gian |
| `from` | Có | Tạo một khoảng từ một đơn vị temporal |
| `of` | Có | Tạo một instance của khoảng này từ các thành phần cấu thành của nó |
| `parse` | Có | Tạo một instance của khoảng này từ một String |
| `addTo` | Không | Tạo một bản sao của khoảng này, cộng thêm vào đó đối tượng temporal được chỉ định |
| `get` | Không | Đọc một phần trạng thái của khoảng này |
| `isNegative` | Không | Kiểm tra xem khoảng này có âm hay không, không tính giá trị 0 |
| `isZero` | Không | Kiểm tra xem khoảng này có độ dài bằng 0 hay không |
| `minus` | Không | Tạo một bản sao của khoảng này với một lượng thời gian bị trừ đi |
| `multipliedBy` | Không | Tạo một bản sao của khoảng này được nhân với một số vô hướng cho trước |
| `negated` | Không | Tạo một bản sao của khoảng này với độ dài bị đảo dấu |
| `plus` | Không | Tạo một bản sao của khoảng này với một lượng thời gian được cộng thêm |
| `subtractFrom` | Không | Trừ khoảng này khỏi đối tượng temporal được chỉ định |

Tất cả các lớp mà chúng ta đã khảo sát cho tới đây đều là immutable, đây là một lựa chọn thiết kế tuyệt vời nhằm cho phép một phong cách functional programming hơn, đảm bảo an toàn luồng (thread safety), và giữ gìn tính nhất quán của mô hình miền (domain model). Tuy vậy, Date and Time API mới vẫn cung cấp một số phương thức tiện dụng để tạo ra các phiên bản đã được sửa đổi của những đối tượng đó. Chẳng hạn bạn có thể muốn cộng thêm ba ngày vào một instance `LocalDate` sẵn có, và chúng ta sẽ khám phá cách làm việc này trong mục kế tiếp. Ngoài ra, chúng ta sẽ khám phá cách tạo một date-time formatter từ một mẫu (pattern) cho trước, chẳng hạn `dd/MM/yyyy`, hoặc thậm chí tạo theo cách lập trình, cũng như cách dùng formatter này cho cả việc parse lẫn in ra một ngày.

## 12.2. Thao tác, parse và định dạng ngày tháng

Cách trực tiếp và dễ dàng nhất để tạo ra một phiên bản đã sửa đổi của một `LocalDate` sẵn có là thay đổi một trong các thuộc tính của nó, bằng cách dùng một trong các phương thức dạng `withAttribute`. Lưu ý rằng tất cả các phương thức này trả về một đối tượng mới với thuộc tính đã được sửa đổi, như minh hoạ trong listing 12.6; chúng không biến đổi đối tượng sẵn có!

**Listing 12.6. Thao tác các thuộc tính của một LocalDate theo cách tuyệt đối**

```java
LocalDate date1 = LocalDate.of(2017, 9, 21);                  // 2017-09-21
LocalDate date2 = date1.withYear(2011);                       // 2011-09-21
LocalDate date3 = date2.withDayOfMonth(25);                   // 2011-09-25
LocalDate date4 = date3.with(ChronoField.MONTH_OF_YEAR, 2);   // 2011-02-25
```

Bạn có thể làm điều tương tự với phương thức tổng quát hơn là `with`, nhận một `TemporalField` làm đối số đầu tiên, như trong câu lệnh cuối cùng của listing 12.6. Phương thức `with` này chính là phương thức đối ngẫu (dual) của phương thức `get` được dùng trong listing 12.2. Cả hai phương thức này đều được khai báo trong interface `Temporal`, vốn được cài đặt bởi tất cả các lớp của Date and Time API như `LocalDate`, `LocalTime`, `LocalDateTime` và `Instant`. Nói chính xác hơn, các phương thức `get` và `with` lần lượt cho phép bạn đọc và sửa đổi[^1] các trường của một đối tượng `Temporal`. Chúng ném ra `UnsupportedTemporalTypeException` nếu trường được yêu cầu không được hỗ trợ bởi `Temporal` cụ thể đó, chẳng hạn `ChronoField.MONTH_OF_YEAR` trên một `Instant`, hoặc `ChronoField.NANO_OF_SECOND` trên một `LocalDate`.

> [^1]: Hãy nhớ rằng những phương thức dạng "with" như vậy không sửa đổi đối tượng `Temporal` sẵn có, mà tạo ra một bản sao với trường cụ thể đã được cập nhật. Quá trình này được gọi là functional update (cập nhật theo kiểu hàm) — xem chương 19.

Thậm chí bạn còn có thể thao tác một `LocalDate` theo cách khai báo (declarative). Chẳng hạn bạn có thể cộng thêm hoặc trừ bớt một lượng thời gian cho trước, như minh hoạ trong listing 12.7.

**Listing 12.7. Thao tác các thuộc tính của một LocalDate theo cách tương đối**

```java
LocalDate date1 = LocalDate.of(2017, 9, 21);              // 2017-09-21
LocalDate date2 = date1.plusWeeks(1);                     // 2017-09-28
LocalDate date3 = date2.minusYears(6);                    // 2011-09-28
LocalDate date4 = date3.plus(6, ChronoUnit.MONTHS);       // 2012-03-28
```

Tương tự như những gì chúng tôi đã giải thích về các phương thức `with` và `get`, phương thức tổng quát `plus` được dùng trong câu lệnh cuối cùng của listing 12.7, cùng với phương thức tương tự là `minus`, được khai báo trong interface `Temporal`. Những phương thức này cho phép bạn dịch chuyển một `Temporal` lùi lại hoặc tiến tới một lượng thời gian cho trước, được xác định bởi một con số cộng với một `TemporalUnit`, trong đó enum `ChronoUnit` cung cấp một phần cài đặt tiện lợi cho interface `TemporalUnit`.

Như bạn có thể đã đoán trước, tất cả các lớp date-time biểu diễn một điểm thời gian như `LocalDate`, `LocalTime`, `LocalDateTime` và `Instant` đều có nhiều phương thức chung. Bảng 12.2 tóm tắt các phương thức đó.

**Bảng 12.2. Các phương thức chung của những lớp date-time biểu diễn một điểm thời gian**

| Phương thức | Static | Mô tả |
|---|---|---|
| `from` | Có | Tạo một instance của lớp này từ đối tượng temporal được truyền vào |
| `now` | Có | Tạo một đối tượng temporal từ đồng hồ hệ thống |
| `of` | Có | Tạo một instance của đối tượng temporal này từ các thành phần cấu thành của nó |
| `parse` | Có | Tạo một instance của đối tượng temporal này từ một String |
| `atOffset` | Không | Kết hợp đối tượng temporal này với một zone offset |
| `atZone` | Không | Kết hợp đối tượng temporal này với một time zone |
| `format` | Không | Chuyển đổi đối tượng temporal này thành một String bằng formatter được chỉ định (không khả dụng cho `Instant`) |
| `get` | Không | Đọc một phần trạng thái của đối tượng temporal này |
| `minus` | Không | Tạo một bản sao của đối tượng temporal này với một lượng thời gian bị trừ đi |
| `plus` | Không | Tạo một bản sao của đối tượng temporal này với một lượng thời gian được cộng thêm |
| `with` | Không | Tạo một bản sao của đối tượng temporal này với một phần trạng thái đã bị thay đổi |

Hãy kiểm tra lại những gì bạn đã học được cho tới giờ về việc thao tác ngày tháng bằng quiz 12.1.

---

**Quiz 12.1: Thao tác một LocalDate**

Giá trị của biến `date` sẽ là gì sau các thao tác sau đây?

```java
LocalDate date = LocalDate.of(2014, 3, 18);
date = date.with(ChronoField.MONTH_OF_YEAR, 9);
date = date.plusYears(2).minusDays(10);
date.withYear(2011);
```

**Đáp án:**

```text
2016-09-08
```

---

Như bạn đã thấy, bạn có thể thao tác ngày tháng theo cả cách tuyệt đối lẫn cách tương đối. Bạn cũng có thể nối tiếp nhiều thao tác trong một câu lệnh duy nhất, bởi vì mỗi thay đổi đều tạo ra một đối tượng `LocalDate` mới, và lời gọi kế tiếp sẽ thao tác trên đối tượng do lời gọi trước tạo ra. Cuối cùng, câu lệnh cuối cùng trong đoạn code này không có tác dụng nào quan sát được, bởi vì như thường lệ, nó tạo ra một instance `LocalDate` mới, nhưng chúng ta lại không gán giá trị mới này cho bất kỳ biến nào.

### 12.2.1. Làm việc với TemporalAdjusters

Tất cả những thao tác ngày tháng bạn đã thấy cho tới giờ đều tương đối đơn giản. Tuy nhiên, đôi khi bạn cần thực hiện những thao tác nâng cao hơn, chẳng hạn như điều chỉnh một ngày về Chủ nhật kế tiếp, ngày làm việc kế tiếp, hoặc ngày cuối cùng của tháng. Trong những trường hợp như vậy, bạn có thể truyền một `TemporalAdjuster` vào một phiên bản nạp chồng của phương thức `with`; `TemporalAdjuster` cung cấp một cách tuỳ biến cao hơn để định nghĩa thao tác cần thực hiện trên một ngày cụ thể. Date and Time API đã cung cấp sẵn nhiều `TemporalAdjuster` định nghĩa trước cho những trường hợp sử dụng phổ biến nhất. Bạn có thể truy cập chúng bằng các static factory method chứa trong lớp `TemporalAdjusters`, như minh hoạ trong listing 12.8.

**Listing 12.8. Sử dụng các TemporalAdjusters định nghĩa sẵn**

```java
import static java.time.temporal.TemporalAdjusters.*;

LocalDate date1 = LocalDate.of(2014, 3, 18);                  // 2014-03-18
LocalDate date2 = date1.with(nextOrSame(DayOfWeek.SUNDAY));   // 2014-03-23
LocalDate date3 = date2.with(lastDayOfMonth());               // 2014-03-31
```

Bảng 12.3 liệt kê các `TemporalAdjuster` mà bạn có thể tạo bằng những factory method này.

**Bảng 12.3. Các factory method của lớp TemporalAdjusters**

| Phương thức | Mô tả |
|---|---|
| `dayOfWeekInMonth` | Tạo một ngày mới trong cùng tháng với thứ trong tuần theo thứ tự chỉ định. (Số âm sẽ đếm ngược từ cuối tháng.) |
| `firstDayOfMonth` | Tạo một ngày mới được đặt về ngày đầu tiên của tháng hiện tại. |
| `firstDayOfNextMonth` | Tạo một ngày mới được đặt về ngày đầu tiên của tháng kế tiếp. |
| `firstDayOfNextYear` | Tạo một ngày mới được đặt về ngày đầu tiên của năm kế tiếp. |
| `firstDayOfYear` | Tạo một ngày mới được đặt về ngày đầu tiên của năm hiện tại. |
| `firstInMonth` | Tạo một ngày mới trong cùng tháng với thứ trong tuần khớp đầu tiên. |
| `lastDayOfMonth` | Tạo một ngày mới được đặt về ngày cuối cùng của tháng hiện tại. |
| `lastDayOfNextMonth` | Tạo một ngày mới được đặt về ngày cuối cùng của tháng kế tiếp. |
| `lastDayOfNextYear` | Tạo một ngày mới được đặt về ngày cuối cùng của năm kế tiếp. |
| `lastDayOfYear` | Tạo một ngày mới được đặt về ngày cuối cùng của năm hiện tại. |
| `lastInMonth` | Tạo một ngày mới trong cùng tháng với thứ trong tuần khớp cuối cùng. |
| `next` / `previous` | Tạo một ngày mới được đặt về lần xuất hiện đầu tiên của thứ trong tuần được chỉ định, sau/trước ngày đang được điều chỉnh. |
| `nextOrSame` / `previousOrSame` | Tạo một ngày mới được đặt về lần xuất hiện đầu tiên của thứ trong tuần được chỉ định, sau/trước ngày đang được điều chỉnh, trừ khi ngày đó đã đúng là thứ ấy rồi, trong trường hợp này chính đối tượng đó được trả về. |

Như bạn thấy, các `TemporalAdjuster` cho phép bạn thực hiện những thao tác ngày tháng phức tạp hơn mà vẫn đọc lên giống như chính phát biểu bài toán. Hơn nữa, việc tạo phần cài đặt `TemporalAdjuster` tuỳ chỉnh của riêng bạn cũng tương đối đơn giản, nếu bạn không tìm được một `TemporalAdjuster` định nghĩa sẵn nào phù hợp với nhu cầu của mình. Thật vậy, interface `TemporalAdjuster` chỉ khai báo duy nhất một phương thức (điều này khiến nó trở thành một functional interface), được định nghĩa như trong listing dưới đây.

**Listing 12.9. Interface TemporalAdjuster**

```java
@FunctionalInterface
public interface TemporalAdjuster {
    Temporal adjustInto(Temporal temporal);
}
```

Ví dụ này có nghĩa là một phần cài đặt của interface `TemporalAdjuster` sẽ định nghĩa cách chuyển đổi một đối tượng `Temporal` thành một `Temporal` khác. Bạn có thể hình dung một `TemporalAdjuster` giống như một `UnaryOperator<Temporal>`. Hãy dành vài phút để luyện tập những gì bạn đã học cho tới giờ và tự cài đặt `TemporalAdjuster` của riêng bạn trong quiz 12.2.

---

**Quiz 12.2: Cài đặt một TemporalAdjuster tuỳ chỉnh**

Hãy phát triển một lớp tên là `NextWorkingDay`, cài đặt interface `TemporalAdjuster`, có nhiệm vụ dịch một ngày tiến lên một ngày nhưng bỏ qua thứ Bảy và Chủ nhật. Việc dùng

```java
date = date.with(new NextWorkingDay());
```

phải dịch ngày đó sang ngày kế tiếp nếu ngày này rơi vào khoảng từ thứ Hai đến thứ Sáu, nhưng phải dịch sang thứ Hai kế tiếp nếu nó là thứ Bảy hoặc Chủ nhật.

**Đáp án:**

Bạn có thể cài đặt adjuster `NextWorkingDay` như sau:

```java
public class NextWorkingDay implements TemporalAdjuster {
    @Override
    public Temporal adjustInto(Temporal temporal) {
        // Đọc ngày hiện tại trong tuần.
        DayOfWeek dow =
                DayOfWeek.of(temporal.get(ChronoField.DAY_OF_WEEK));
        int dayToAdd = 1;                                    // Thông thường cộng thêm một ngày.
        if (dow == DayOfWeek.FRIDAY) dayToAdd = 3;           // Nhưng cộng thêm ba ngày nếu hôm nay là thứ Sáu.
        else if (dow == DayOfWeek.SATURDAY) dayToAdd = 2;    // Cộng thêm hai ngày nếu hôm nay là thứ Bảy.
        // Trả về ngày đã sửa đổi bằng cách cộng thêm đúng số ngày cần thiết.
        return temporal.plus(dayToAdd, ChronoUnit.DAYS);
    }
}
```

---

`TemporalAdjuster` này thông thường sẽ dịch một ngày tiến lên một ngày, ngoại trừ khi hôm nay là thứ Sáu hoặc thứ Bảy, khi đó nó lần lượt đẩy ngày tiến lên ba hoặc hai ngày. Lưu ý rằng vì `TemporalAdjuster` là một functional interface, bạn có thể truyền hành vi của adjuster này dưới dạng một lambda expression:

```java
date = date.with(temporal -> {
    DayOfWeek dow =
            DayOfWeek.of(temporal.get(ChronoField.DAY_OF_WEEK));
    int dayToAdd = 1;
    if (dow == DayOfWeek.FRIDAY) dayToAdd = 3;
    else if (dow == DayOfWeek.SATURDAY) dayToAdd = 2;
    return temporal.plus(dayToAdd, ChronoUnit.DAYS);
});
```

Nhiều khả năng bạn sẽ muốn áp dụng thao tác này cho một ngày ở nhiều điểm khác nhau trong code của mình, và vì lý do đó, chúng tôi khuyên bạn nên đóng gói logic của nó vào một lớp riêng đúng nghĩa, như chúng tôi đã làm ở đây. Hãy làm tương tự với tất cả các thao tác mà bạn dùng thường xuyên. Rốt cuộc bạn sẽ có một thư viện nhỏ gồm các adjuster mà bạn và cả nhóm có thể dễ dàng tái sử dụng trong codebase của mình.

Nếu bạn muốn định nghĩa `TemporalAdjuster` bằng một lambda expression, tốt hơn là nên làm điều đó thông qua static factory `ofDateAdjuster` của lớp `TemporalAdjusters`, vốn nhận vào một `UnaryOperator<LocalDate>` như sau:

```java
TemporalAdjuster nextWorkingDay = TemporalAdjusters.ofDateAdjuster(
    temporal -> {
        DayOfWeek dow =
                DayOfWeek.of(temporal.get(ChronoField.DAY_OF_WEEK));
        int dayToAdd = 1;
        if (dow == DayOfWeek.FRIDAY) dayToAdd = 3;
        else if (dow == DayOfWeek.SATURDAY) dayToAdd = 2;
        return temporal.plus(dayToAdd, ChronoUnit.DAYS);
    });
date = date.with(nextWorkingDay);
```

Một thao tác phổ biến khác mà bạn có thể muốn thực hiện trên các đối tượng ngày và giờ của mình là in chúng ra theo những định dạng khác nhau, đặc trưng cho miền nghiệp vụ của bạn. Tương tự, bạn có thể muốn chuyển đổi các String biểu diễn ngày tháng theo những định dạng đó thành các đối tượng ngày thực sự. Trong mục kế tiếp, chúng tôi sẽ trình bày các cơ chế mà Date and Time API mới cung cấp để hoàn thành những nhiệm vụ này.

### 12.2.2. In và parse các đối tượng date-time

Định dạng (formatting) và parse là những tính năng quan trọng khác khi làm việc với ngày và giờ. Package mới `java.time.format` được dành riêng cho những mục đích này. Lớp quan trọng nhất của package này là `DateTimeFormatter`. Cách dễ nhất để tạo một formatter là thông qua các static factory method và các hằng số của nó. Những hằng số như `BASIC_ISO_DATE` và `ISO_LOCAL_DATE` là các instance định nghĩa sẵn của lớp `DateTimeFormatter`. Bạn có thể dùng tất cả các `DateTimeFormatter` để tạo ra một String biểu diễn một ngày hoặc giờ cho trước theo một định dạng cụ thể. Ví dụ, ở đây chúng ta tạo ra một String bằng hai formatter khác nhau:

```java
LocalDate date = LocalDate.of(2014, 3, 18);
String s1 = date.format(DateTimeFormatter.BASIC_ISO_DATE);   // 20140318
String s2 = date.format(DateTimeFormatter.ISO_LOCAL_DATE);   // 2014-03-18
```

Bạn cũng có thể parse một String biểu diễn một ngày hoặc một giờ theo định dạng đó để tạo lại chính đối tượng ngày ban đầu. Bạn có thể thực hiện việc này bằng factory method `parse` mà tất cả các lớp của Date and Time API biểu diễn một điểm thời gian hoặc một khoảng thời gian đều cung cấp:

```java
LocalDate date1 = LocalDate.parse("20140318",
                                  DateTimeFormatter.BASIC_ISO_DATE);
LocalDate date2 = LocalDate.parse("2014-03-18",
                                  DateTimeFormatter.ISO_LOCAL_DATE);
```

So với lớp `java.util.DateFormat` cũ, tất cả các instance `DateTimeFormatter` đều thread-safe. Vì vậy, bạn có thể tạo các formatter dạng singleton giống như những formatter được định nghĩa bởi các hằng số của `DateTimeFormatter` và chia sẻ chúng giữa nhiều thread. Listing kế tiếp cho thấy lớp `DateTimeFormatter` còn hỗ trợ một static factory method cho phép bạn tạo một formatter từ một pattern cụ thể.

**Listing 12.10. Tạo một DateTimeFormatter từ một pattern**

```java
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
LocalDate date1 = LocalDate.of(2014, 3, 18);
String formattedDate = date1.format(formatter);
LocalDate date2 = LocalDate.parse(formattedDate, formatter);
```

Ở đây, phương thức `format` của `LocalDate` tạo ra một String biểu diễn ngày theo pattern được yêu cầu. Tiếp đó, phương thức static `parse` tạo lại đúng ngày đó bằng cách parse String vừa sinh ra, sử dụng cùng formatter ấy. Phương thức `ofPattern` cũng có một phiên bản nạp chồng cho phép bạn tạo một formatter cho một `Locale` cho trước, như minh hoạ trong listing dưới đây.

**Listing 12.11. Tạo một DateTimeFormatter có bản địa hoá (localized)**

```java
DateTimeFormatter italianFormatter =
        DateTimeFormatter.ofPattern("d. MMMM yyyy", Locale.ITALIAN);
LocalDate date1 = LocalDate.of(2014, 3, 18);
String formattedDate = date.format(italianFormatter);   // 18. marzo 2014
LocalDate date2 = LocalDate.parse(formattedDate, italianFormatter);
```

Cuối cùng, trong trường hợp bạn cần kiểm soát nhiều hơn nữa, lớp `DateTimeFormatterBuilder` cho phép bạn định nghĩa những formatter phức tạp theo từng bước bằng các phương thức có ý nghĩa rõ ràng. Ngoài ra, nó còn cho bạn khả năng thực hiện parse không phân biệt hoa thường (case-insensitive), parse khoan dung (lenient parsing — cho phép bộ parse dùng các phương pháp suy đoán để diễn giải những đầu vào không khớp chính xác với định dạng đã chỉ định), thêm phần đệm (padding), và định nghĩa các phần tuỳ chọn của formatter. Ví dụ, bạn có thể xây dựng theo cách lập trình chính formatter `italianFormatter` mà chúng ta đã dùng trong listing 12.11 thông qua `DateTimeFormatterBuilder`, như minh hoạ trong listing dưới đây.

**Listing 12.12. Xây dựng một DateTimeFormatter**

```java
DateTimeFormatter italianFormatter = new DateTimeFormatterBuilder()
        .appendText(ChronoField.DAY_OF_MONTH)
        .appendLiteral(". ")
        .appendText(ChronoField.MONTH_OF_YEAR)
        .appendLiteral(" ")
        .appendText(ChronoField.YEAR)
        .parseCaseInsensitive()
        .toFormatter(Locale.ITALIAN);
```

Cho tới đây, bạn đã học cách tạo, thao tác, định dạng và parse cả các điểm thời gian lẫn các khoảng thời gian, nhưng bạn vẫn chưa thấy cách xử lý những chi tiết tinh tế liên quan đến ngày và giờ. Bạn có thể cần làm việc với các time zone khác nhau hoặc các hệ lịch thay thế. Trong các mục kế tiếp, chúng ta sẽ khám phá những chủ đề này bằng Date and Time API mới.

## 12.3. Làm việc với các time zone và hệ lịch khác nhau

Không lớp nào trong số các lớp bạn đã thấy cho tới giờ chứa bất kỳ thông tin nào về time zone. Việc xử lý time zone là một vấn đề quan trọng khác đã được đơn giản hoá đáng kể bởi Date and Time API mới. Lớp mới `java.time.ZoneId` là lớp thay thế cho lớp `java.util.TimeZone` cũ. Nó hướng tới việc che chắn bạn tốt hơn khỏi những phức tạp liên quan đến time zone, chẳng hạn như việc xử lý Daylight Saving Time (DST — giờ mùa hè). Giống như các lớp khác của Date and Time API, nó là immutable.

### 12.3.1. Sử dụng time zone

Một time zone là một tập các quy tắc tương ứng với một vùng lãnh thổ mà trong đó giờ chuẩn là như nhau. Khoảng 40 time zone được lưu giữ trong các instance của lớp `ZoneRules`. Bạn có thể gọi `getRules()` trên một `ZoneId` để lấy các quy tắc cho time zone đó. Một `ZoneId` cụ thể được định danh bằng một region ID, như trong ví dụ sau:

```java
ZoneId romeZone = ZoneId.of("Europe/Rome");
```

Tất cả các region ID đều có dạng `"{area}/{city}"`, và tập các vị trí khả dụng chính là tập do Internet Assigned Numbers Authority (IANA) Time Zone Database cung cấp (xem https://www.iana.org/time-zones). Bạn cũng có thể chuyển đổi một đối tượng `TimeZone` cũ thành một `ZoneId` bằng phương thức mới `toZoneId`:

```java
ZoneId zoneId = TimeZone.getDefault().toZoneId();
```

Khi đã có một đối tượng `ZoneId`, bạn có thể kết hợp nó với một `LocalDate`, một `LocalDateTime` hoặc một `Instant` để biến chúng thành các instance `ZonedDateTime`, vốn biểu diễn các điểm thời gian tương đối so với time zone được chỉ định, như minh hoạ trong listing dưới đây.

**Listing 12.13. Áp dụng một time zone lên một điểm thời gian**

```java
LocalDate date = LocalDate.of(2014, Month.MARCH, 18);
ZonedDateTime zdt1 = date.atStartOfDay(romeZone);

LocalDateTime dateTime = LocalDateTime.of(2014, Month.MARCH, 18, 13, 45);
ZonedDateTime zdt2 = dateTime.atZone(romeZone);

Instant instant = Instant.now();
ZonedDateTime zdt3 = instant.atZone(romeZone);
```

Hình 12.1 minh hoạ các thành phần của một `ZonedDateTime` để giúp bạn hiểu được sự khác biệt giữa `LocalDate`, `LocalTime`, `LocalDateTime` và `ZoneId`.

> **Hình 12.1.** Hiểu về một ZonedDateTime

Bạn cũng có thể chuyển đổi một `LocalDateTime` thành một `Instant` bằng cách dùng một `ZoneId`:

```java
LocalDateTime dateTime = LocalDateTime.of(2014, Month.MARCH, 18, 13, 45);
Instant instantFromDateTime = dateTime.toInstant(romeZone);
```

Hoặc bạn có thể làm theo chiều ngược lại:

```java
Instant instant = Instant.now();
LocalDateTime timeFromInstant = LocalDateTime.ofInstant(instant, romeZone);
```

Lưu ý rằng việc làm việc với `Instant` khá hữu ích, bởi bạn thường phải làm việc với code cũ (legacy code) vốn dùng lớp `Date`. Ở đó, hai phương thức đã được bổ sung để giúp việc tương tác qua lại giữa API bị deprecated và Date and Time API mới: `toInstant()` và phương thức static `fromInstant()`.

### 12.3.2. Offset cố định so với UTC/Greenwich

Một cách phổ biến khác để biểu diễn một time zone là dùng một offset cố định so với UTC/Greenwich. Chẳng hạn, bạn có thể dùng ký hiệu này để nói rằng "New York chậm hơn London năm giờ". Trong những trường hợp như thế này, bạn có thể dùng lớp `ZoneOffset`, một lớp con của `ZoneId`, biểu diễn chênh lệch giữa một thời điểm và kinh tuyến gốc tại Greenwich, London, như sau:

```java
ZoneOffset newYorkOffset = ZoneOffset.of("-05:00");
```

Offset `-05:00` quả thực tương ứng với U.S. Eastern Standard Time. Tuy nhiên, hãy lưu ý rằng một `ZoneOffset` được định nghĩa theo cách này không có bất kỳ cơ chế quản lý Daylight Saving Time nào, và vì lý do đó, nó không được khuyến nghị trong phần lớn các trường hợp. Bởi vì một `ZoneOffset` cũng là một `ZoneId`, bạn có thể dùng nó như đã minh hoạ trong listing 12.13 ở phần trước của chương này. Bạn cũng có thể tạo một `OffsetDateTime`, vốn biểu diễn một date-time kèm theo một offset so với UTC/Greenwich trong hệ lịch ISO-8601:

```java
LocalDateTime dateTime = LocalDateTime.of(2014, Month.MARCH, 18, 13, 45);
OffsetDateTime dateTimeInNewYork = OffsetDateTime.of(date, newYorkOffset);
```

Một tính năng nâng cao khác được Date and Time API mới hỗ trợ là hỗ trợ cho các hệ lịch không theo chuẩn ISO.

### 12.3.3. Sử dụng các hệ lịch thay thế

Hệ lịch ISO-8601 trên thực tế là hệ lịch dân sự của toàn thế giới. Nhưng Java 8 còn cung cấp thêm bốn hệ lịch nữa. Mỗi hệ lịch này có một lớp ngày chuyên biệt: `ThaiBuddhistDate`, `MinguoDate`, `JapaneseDate` và `HijrahDate`. Tất cả các lớp này, cùng với `LocalDate`, đều cài đặt interface `ChronoLocalDate`, vốn được thiết kế để mô hình hoá một ngày trong một hệ niên đại (chronology) bất kỳ. Bạn có thể tạo một instance của một trong các lớp này từ một `LocalDate`. Tổng quát hơn, bạn có thể tạo bất kỳ instance `Temporal` nào khác bằng các static factory method `from` của chúng, như sau:

```java
LocalDate date = LocalDate.of(2014, Month.MARCH, 18);
JapaneseDate japaneseDate = JapaneseDate.from(date);
```

Ngoài ra, bạn có thể tạo một cách tường minh một hệ lịch cho một `Locale` cụ thể rồi tạo một instance ngày cho `Locale` đó. Trong Date and Time API mới, interface `Chronology` mô hình hoá một hệ lịch, và bạn có thể lấy một instance của nó bằng static factory method `ofLocale`:

```java
Chronology japaneseChronology = Chronology.ofLocale(Locale.JAPAN);
ChronoLocalDate now = japaneseChronology.dateNow();
```

Các nhà thiết kế của Date and Time API khuyên nên dùng `LocalDate` thay vì `ChronoLocalDate` trong hầu hết các trường hợp, bởi vì một lập trình viên có thể đưa ra những giả định trong code của mình mà đáng tiếc lại không đúng trong một hệ đa lịch. Những giả định như vậy có thể bao gồm việc tin rằng giá trị của một ngày hoặc một tháng sẽ không bao giờ lớn hơn 31, rằng một năm chứa 12 tháng, hoặc thậm chí rằng một năm có một số tháng cố định. Vì những lý do đó, chúng tôi khuyến nghị dùng `LocalDate` xuyên suốt ứng dụng của bạn, bao gồm toàn bộ việc lưu trữ, thao tác và diễn giải các quy tắc nghiệp vụ, trong khi chỉ nên dùng `ChronoLocalDate` khi bạn cần bản địa hoá đầu vào hoặc đầu ra của chương trình.

> **Lịch Hồi giáo (Islamic calendar)**
>
> Trong số các hệ lịch mới được thêm vào Java 8, `HijrahDate` (lịch Hồi giáo) có vẻ là phức tạp nhất bởi vì nó có thể có nhiều biến thể. Hệ lịch Hijrah dựa trên các tháng âm lịch. Có nhiều phương pháp khác nhau để xác định một tháng mới, chẳng hạn như dựa vào trăng non có thể được nhìn thấy ở bất cứ đâu trên thế giới, hoặc phải được nhìn thấy trước tiên tại Ả Rập Xê Út. Phương thức `withVariant` được dùng để chọn biến thể mong muốn. Java 8 bao gồm biến thể Umm Al-Qura cho `HijrahDate` như biến thể chuẩn.
>
> Đoạn code sau minh hoạ một ví dụ hiển thị ngày bắt đầu và ngày kết thúc của tháng Ramadan cho năm Hồi giáo hiện tại theo ngày ISO:
>
> ```java
> // Lấy ngày Hijrah hiện tại; sau đó đổi nó thành ngày đầu tiên
> // của tháng Ramadan, tức tháng thứ chín.
> HijrahDate ramadanDate =
>     HijrahDate.now().with(ChronoField.DAY_OF_MONTH, 1)
>                     .with(ChronoField.MONTH_OF_YEAR, 9);
> // IsoChronology.INSTANCE là một instance static của lớp IsoChronology.
> System.out.println("Ramadan starts on " +
>                    IsoChronology.INSTANCE.date(ramadanDate) +
>                    " and ends on " +
>                    IsoChronology.INSTANCE.date(
>                        ramadanDate.with(
>                            TemporalAdjusters.lastDayOfMonth())));
> // Ramadan năm 1438 bắt đầu vào 2017-05-26 và kết thúc vào 2017-06-24.
> ```

## Tóm tắt

- Lớp `java.util.Date` cũ và tất cả các lớp khác được dùng để mô hình hoá ngày và giờ trong Java trước Java 8 đều có nhiều điểm thiếu nhất quán và khiếm khuyết thiết kế, bao gồm tính mutable cùng một số offset, giá trị mặc định và cách đặt tên được lựa chọn kém.
- Tất cả các đối tượng date-time của Date and Time API mới đều là immutable.
- API mới này cung cấp hai cách biểu diễn thời gian khác nhau để đáp ứng những nhu cầu khác nhau của con người và của máy tính khi thao tác trên thời gian.
- Bạn có thể thao tác các đối tượng ngày và giờ theo cả cách tuyệt đối lẫn cách tương đối, và kết quả của những thao tác này luôn là một instance mới, còn instance ban đầu vẫn không bị thay đổi.
- Các `TemporalAdjuster` cho phép bạn thao tác một ngày theo cách phức tạp hơn so với việc chỉ thay đổi một trong các giá trị của nó, và bạn có thể tự định nghĩa cũng như sử dụng các phép biến đổi ngày tuỳ chỉnh của riêng mình.
- Bạn có thể định nghĩa một formatter để in và parse các đối tượng date-time theo một định dạng cụ thể. Những formatter này có thể được tạo từ một pattern hoặc được tạo theo cách lập trình, và tất cả chúng đều thread-safe.
- Bạn có thể biểu diễn một time zone, dưới dạng tương đối so với một vùng/vị trí cụ thể cũng như dưới dạng một offset cố định so với UTC/Greenwich, rồi áp dụng nó lên một đối tượng date-time để bản địa hoá đối tượng đó.
- Bạn có thể sử dụng các hệ lịch khác với hệ lịch chuẩn ISO-8601.
