// Thư viện tài liệu — gộp từ js/data/<lĩnh vực>/docs.js.
// Mỗi lĩnh vực tự quản danh mục của mình; tệp này chỉ nối lại theo thứ tự cố định
// (thứ tự giữa các lĩnh vực không ảnh hưởng gì — mọi view lọc theo field).
// Thêm lĩnh vực mới: tạo js/data/<id>/docs.js rồi thêm một dòng import ở đây.

import { docs as kubernetes } from "./kubernetes/docs.js";
import { docs as java } from "./java/docs.js";
import { docs as sysprog } from "./sysprog/docs.js";
import { docs as springSecurity } from "./spring-security/docs.js";
import { docs as seniorJava } from "./senior-java/docs.js";
import { docs as modernConcurrency } from "./modern-concurrency/docs.js";
import { docs as ddia } from "./ddia/docs.js";
import { docs as modernJava } from "./modern-java/docs.js";
import { docs as kafka } from "./kafka/docs.js";
import { docs as springStart } from "./spring-start/docs.js";

export const docs = [
  ...kubernetes,
  ...java,
  ...sysprog,
  ...springSecurity,
  ...seniorJava,
  ...modernConcurrency,
  ...ddia,
  ...modernJava,
  ...kafka,
  ...springStart,
];
