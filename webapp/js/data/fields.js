// Khai báo các lĩnh vực học của DevPrep — nguồn sự thật duy nhất.
// Thêm một lĩnh vực hoặc mở thêm module cho lĩnh vực: chỉ sửa file này.
//
// `modules` quyết định sidebar hiện những mục nào. Chỉ khai một module khi
// lĩnh vực đó ĐÃ có dữ liệu tương ứng — check-data.mjs sẽ báo lỗi nếu không.

export const FIELDS = {
  kubernetes: {
    label: "Kubernetes & Chứng chỉ",
    icon: "☸️",
    desc: "Luyện thi CKAD, CKA, CKS: giáo trình theo tuần, tra cứu kubectl, flashcards, trắc nghiệm, thi thử và labs mô phỏng đề thật.",
    certFilter: true,
    modules: ["dashboard", "certs", "roadmap", "docs", "commands",
              "flashcards", "quiz", "exam", "labs"],
    // Liên kết tham khảo ngoài, hiện ở chân sidebar. Tuỳ chọn — bỏ qua nếu
    // lĩnh vực không có nguồn ngoài phù hợp (xem "java" bên dưới).
    externalRef: { label: "kubernetes.io/docs", href: "https://kubernetes.io/docs/" },
  },
  sysprog: {
    label: "Lập trình hệ thống",
    icon: "🖥️",
    desc: "Bản dịch tiếng Việt System Programming Coursebook (University of Illinois, CS 241) — B. Venkatesh, L. Angrave et al., CC BY 4.0. C, tiến trình, luồng, đồng bộ hoá, bộ nhớ ảo, IPC, mạng và hệ thống tệp.",
    certFilter: false,
    // Mở dần theo dữ liệu: "docs" thêm ở Task 6, "roadmap" Task 8,
    // "flashcards" Task 10, "quiz" Task 11. Khai sớm là bất biến #7 báo đỏ.
    modules: ["dashboard", "roadmap", "docs", "flashcards", "quiz"],
    externalRef: { label: "illinois-cs241/coursebook", href: "https://github.com/illinois-cs241/coursebook" },
  },
  java: {
    label: "Java & Spring Boot Scalability",
    icon: "☕",
    desc: "Series 10 bài về khả năng mở rộng của ứng dụng Java/Spring Boot trên Tomcat: TCP/kernel → Tomcat internals → JVM concurrency → capacity planning → transaction.",
    certFilter: false,
    modules: ["dashboard", "docs"],
    // Không có nguồn ngoài phù hợp cho series này — bỏ qua thay vì bịa link.
  },
  "spring-security": {
    label: "Spring Security",
    icon: "🔒",
    desc: "Bản dịch tiếng Việt Spring Security in Action, ấn bản 2 (Laurențiu Spilcă, Manning 2024) — xác thực, phân quyền, CSRF/CORS, OAuth 2 & OIDC, ứng dụng phản ứng và kiểm thử cấu hình bảo mật.",
    certFilter: false,
    // Mở dần theo dữ liệu: "docs" thêm ở Task 2, "roadmap" ở Task 3.
    // Khai sớm là bất biến #7 báo đỏ.
    modules: ["dashboard", "docs"],
    externalRef: { label: "docs.spring.io/spring-security", href: "https://docs.spring.io/spring-security/reference/" },
  },
};

export const FIELD_ORDER = ["kubernetes", "sysprog", "java", "spring-security"];
export const DEFAULT_FIELD = "kubernetes";

// Thứ tự, nhãn và icon của từng module trong sidebar.
// Lấy nguyên từ index.html cũ để người dùng Kubernetes không thấy khác đi.
export const NAV_GROUPS = [
  { title: "Tổng quan", items: [
      { id: "dashboard",  label: "Bảng điều khiển", icon: "🏠", href: "#/" },
      { id: "certs",      label: "Chứng chỉ K8s",   icon: "🎓", href: "#/certs" },
      { id: "roadmap",    label: "Lộ trình học",    icon: "🗺️", href: "#/roadmap" } ] },
  { title: "Học & tham khảo", items: [
      { id: "docs",       label: "Tài liệu",        icon: "📚", href: "#/docs" },
      { id: "commands",   label: "Thực hành nhanh", icon: "⚡", href: "#/commands" } ] },
  { title: "Luyện tập", items: [
      { id: "flashcards", label: "Flashcards",      icon: "🃏", href: "#/flashcards" },
      { id: "quiz",       label: "Trắc nghiệm",     icon: "✅", href: "#/quiz" },
      { id: "exam",       label: "Thi thử",         icon: "⏱️", href: "#/exam" },
      { id: "labs",       label: "Labs thực hành",  icon: "🧪", href: "#/labs" } ] },
];

export function isField(id) {
  return Object.prototype.hasOwnProperty.call(FIELDS, id);
}

export function moduleAllowed(fieldId, moduleId) {
  return isField(fieldId) && FIELDS[fieldId].modules.includes(moduleId);
}

// Nhóm nav của một lĩnh vực: giữ lại module lĩnh vực đó có, bỏ nhóm rỗng.
export function navFor(fieldId) {
  const id = isField(fieldId) ? fieldId : DEFAULT_FIELD;
  const mods = new Set(FIELDS[id].modules);
  return NAV_GROUPS
    .map((g) => ({ title: g.title, items: g.items.filter((i) => mods.has(i.id)) }))
    .filter((g) => g.items.length > 0);
}
