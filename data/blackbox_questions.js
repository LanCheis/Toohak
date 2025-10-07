const BLACKBOX_QUESTIONS = [
  {
    quiz_id: "bbt1",
    question: "Kiểm thử hộp đen (Black-box testing) tập trung vào điều gì?",
    answers: [
      "Kiểm tra mã nguồn và cấu trúc bên trong của phần mềm",
      "Kiểm tra đầu vào và đầu ra dựa trên yêu cầu đặc tả",
      "Phân tích luồng điều khiển và dữ liệu nội bộ",
      "Kiểm tra hiệu năng phần cứng"
    ],
    correct_answers: [1]
  },
  {
    quiz_id: "bbt2",
    question: "Mục tiêu chính của kiểm thử hộp đen là gì?",
    answers: [
      "Phát hiện lỗi logic bên trong mã nguồn",
      "Đảm bảo phần mềm hoạt động đúng theo yêu cầu người dùng",
      "Đánh giá hiệu suất phần mềm ở mức hệ thống",
      "Kiểm thử cấu trúc điều khiển"
    ],
    correct_answers: [1]
  },
  {
    quiz_id: "bbt3",
    question: "Kỹ thuật 'Phân vùng tương đương' (Equivalence Partitioning) giúp:",
    answers: [
      "Giảm số lượng ca kiểm thử cần thiết bằng cách chia dữ liệu đầu vào thành các nhóm hợp lệ và không hợp lệ",
      "Kiểm tra từng giá trị đầu vào riêng lẻ",
      "Chỉ tập trung vào giá trị biên",
      "Xác minh tính năng không chức năng"
    ],
    correct_answers: [0]
  },
  {
    quiz_id: "bbt4",
    question: "Trong kiểm thử giá trị biên (Boundary Value Analysis), người kiểm thử nên chọn:",
    answers: [
      "Các giá trị nằm giữa khoảng dữ liệu",
      "Các giá trị ở ranh giới và ngay ngoài ranh giới",
      "Chỉ các giá trị ngẫu nhiên",
      "Các giá trị trung bình của miền dữ liệu"
    ],
    correct_answers: [1]
  },
  {
    quiz_id: "bbt5",
    question: "Bảng quyết định (Decision Table) thường được sử dụng khi:",
    answers: [
      "Có nhiều điều kiện và hành động có thể xảy ra kết hợp",
      "Chỉ có một điều kiện duy nhất cần kiểm tra",
      "Hệ thống không có đầu vào phức tạp",
      "Không có quy tắc nghiệp vụ nào"
    ],
    correct_answers: [0]
  },
  {
    quiz_id: "bbt6",
    question: "Biểu đồ chuyển trạng thái (State Transition Diagram) mô tả điều gì?",
    answers: [
      "Mối quan hệ giữa các lớp trong hệ thống",
      "Cách hệ thống chuyển đổi giữa các trạng thái khi nhận sự kiện",
      "Luồng dữ liệu giữa các module",
      "Quy trình kiểm thử tự động"
    ],
    correct_answers: [1]
  },
  {
    quiz_id: "bbt7",
    question: "Khi nào nên sử dụng kỹ thuật kiểm thử hộp đen?",
    answers: [
      "Khi mã nguồn chưa sẵn sàng",
      "Khi chỉ có đặc tả yêu cầu và giao diện đầu vào/đầu ra",
      "Khi chỉ muốn phân tích cấu trúc bên trong",
      "Khi cần đo hiệu năng CPU"
    ],
    correct_answers: [1]
  },
  {
    quiz_id: "bbt8",
    question: "Ưu điểm của kiểm thử hộp đen là gì?",
    answers: [
      "Không yêu cầu hiểu biết về mã nguồn",
      "Giúp phát hiện lỗi giao diện và chức năng",
      "Có thể áp dụng ở các mức kiểm thử khác nhau (unit, integration, system)",
      "Tất cả đều đúng"
    ],
    correct_answers: [3]
  },
  {
    quiz_id: "bbt9",
    question: "Hạn chế của kiểm thử hộp đen là gì?",
    answers: [
      "Không thể xác định nguyên nhân lỗi trong mã nguồn",
      "Khó đạt được độ bao phủ mã lệnh cao",
      "Có thể bỏ sót các lỗi logic bên trong",
      "Tất cả đều đúng"
    ],
    correct_answers: [3]
  },
  {
    quiz_id: "bbt10",
    question: "Các kỹ thuật kiểm thử hộp đen phổ biến bao gồm:",
    answers: [
      "Phân vùng tương đương (EP)",
      "Phân tích giá trị biên (BVA)",
      "Bảng quyết định và Biểu đồ chuyển trạng thái",
      "Tất cả đều đúng"
    ],
    correct_answers: [3]
  }
];