// Lĩnh vực học đang chọn.
//
// Đây là trạng thái UI, KHÔNG nằm trong URL: markdown bài học của các track
// K8s chứa hàng trăm link #/docs/… và mọi id đều đã duy nhất toàn cục, nên
// thêm cấp lĩnh vực vào hash chỉ tổ làm hỏng link cũ.
//
// File này cố tình KHÔNG import view nào — nhờ vậy view import được nó mà
// không tạo vòng tròn với app.js (app.js đã import toàn bộ view).

import { store } from "./store.js";
import { DEFAULT_FIELD, isField } from "../data/fields.js";

export function currentField() {
  const f = store.get("field");
  return isField(f) ? f : DEFAULT_FIELD;
}

// Trả về true nếu lĩnh vực thực sự đổi.
export function setCurrentField(id) {
  if (!isField(id) || id === currentField()) return false;
  store.set("field", id);
  return true;
}

// Chuyển lĩnh vực rồi điều hướng (mặc định về bảng điều khiển). Nếu hash không đổi
// thì tự phát hashchange để app.js render lại và đồng bộ sidebar.
export function goToField(id, hash = "#/") {
  setCurrentField(id);
  if (location.hash === hash || (hash === "#/" && (location.hash === "" || location.hash === "#"))) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    location.hash = hash;
  }
}
