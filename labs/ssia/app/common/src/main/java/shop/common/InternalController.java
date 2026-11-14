package shop.common;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Endpoint cố ý gây tải để luyện HPA, requests/limits và troubleshooting. */
@RestController
public class InternalController {

  private static final long MAX_MS = 120_000;
  private static final int MAX_MB = 4096;

  private final List<byte[]> held = new ArrayList<>();

  /** Đốt CPU trong {@code ms} mili giây (vòng lặp bận). */
  @GetMapping("/internal/burn")
  public Map<String, Object> burn(@RequestParam(defaultValue = "1000") long ms) {
    long end = System.nanoTime() + Math.min(Math.max(ms, 0), MAX_MS) * 1_000_000L;
    double x = 0;
    while (System.nanoTime() < end) {
      x += Math.sqrt(x + 1);
    }
    return Map.of("burnedMs", ms, "x", x > 0);
  }

  /** Giữ thêm {@code mb} MB bộ nhớ heap cho tới khi process khởi động lại. */
  @GetMapping("/internal/alloc")
  public Map<String, Object> alloc(@RequestParam(defaultValue = "64") int mb) {
    int want = Math.min(Math.max(mb, 0), MAX_MB);
    synchronized (held) {
      for (int i = 0; i < want; i++) {
        byte[] chunk = new byte[1024 * 1024];
        java.util.Arrays.fill(chunk, (byte) 1); // chạm vào trang nhớ để RSS tăng thật
        held.add(chunk);
      }
      return Map.of("allocatedMb", held.size());
    }
  }

  /** Trả lời chậm sau {@code ms} mili giây. */
  @GetMapping("/internal/slow")
  public Map<String, Object> slow(@RequestParam(defaultValue = "1000") long ms)
      throws InterruptedException {
    Thread.sleep(Math.min(Math.max(ms, 0), MAX_MS));
    return Map.of("sleptMs", ms);
  }
}
