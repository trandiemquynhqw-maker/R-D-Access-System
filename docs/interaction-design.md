### 6.7. Thiết kế Tương tác và Phản hồi hệ thống

Thiết kế giao diện người dùng không chỉ dừng lại ở tính thẩm mỹ và bố cục tĩnh, mà còn nằm ở cách hệ thống giao tiếp, phản hồi lại các hành động của người dùng trong thời gian thực. Trong hệ thống quản lý truy cập phòng Lab R&D (R&D Access Management System), các phản hồi tương tác (interaction design) được xây dựng nhất quán nhằm đảm bảo tính an toàn, giảm thiểu sai sót vận hành và nâng cao trải nghiệm sử dụng của kỹ sư, bảo vệ cũng như quản trị viên.

---

#### 6.7.1. Hiệu ứng vi mô (micro‑animations)

Hiệu ứng vi mô là những chuyển động nhỏ, tinh tế nhưng đóng vai trò quan trọng trong việc định hướng hành vi và tạo ra sự mượt mà cho giao diện người dùng.

##### 6.7.1.1. Hiệu ứng pulse‑glow cho cảnh báo đỏ
Hiệu ứng nhấp nháy phát sáng (pulse-glow) xung quanh các hộp cảnh báo đỏ được thiết kế nhằm gây sự chú ý cao độ của nhân viên bảo vệ và quản trị viên khi xảy ra các sự kiện bất thường. Bằng cách sử dụng CSS keyframes thay đổi liên tục độ mờ (opacity) và bán kính lan tỏa của bóng mờ (`box-shadow`) theo chu kỳ 1.5 giây, hộp cảnh báo mang lại cảm giác "đang thở" bằng ánh sáng đỏ dịu. Hiệu ứng này xuất hiện khi có cảnh báo truy cập trái phép hoặc phát hiện thiết bị lạ tại trạm Kiosk. Nó giúp nhân viên vận hành lập tức định vị được vị trí sự cố trên màn hình giám sát lớn mà không gây cảm giác ức chế thị giác hay căng thẳng quá mức như các hiệu ứng nháy đột ngột.

[Hình ảnh: Hiệu ứng pulse-glow trên thẻ cảnh báo đỏ]

##### 6.7.1.2. Hiệu ứng float cho card
Hiệu ứng nổi lên nhẹ nhàng (float) khi di chuột qua các thẻ thông tin (card) đóng vai trò như một phản hồi trực quan báo hiệu phần tử đó có khả năng tương tác. Khi người dùng rê chuột lên thẻ thiết bị hoặc thẻ thống kê, thuộc tính CSS `transform: translateY(-4px)` kết hợp với đổ bóng sâu hơn được áp dụng mượt mà trong khoảng thời gian 0.3 giây. Hiệu ứng này được sử dụng trên các màn hình hiển thị danh sách thiết bị của kỹ sư, các danh mục chức năng hoặc các báo cáo dạng lưới. Phản hồi cơ học cao cấp này mang lại cảm giác sinh động, giúp giao diện bớt khô khan và thôi thúc người dùng nhấp vào để xem chi tiết.

[Hình ảnh: Hiệu ứng float nổi bật khi di chuột qua thẻ thiết bị]

##### 6.7.1.3. Hiệu ứng loading spinner
Vòng xoay tải dữ liệu (loading spinner) là chỉ báo trực quan giúp lấp đầy khoảng thời gian chờ đợi trong lúc hệ thống xử lý các yêu cầu mạng. Hiệu ứng được thể hiện bằng một vòng tròn khuyết xoay liên tục 360 độ (sử dụng CSS spin animation vô hạn) kết hợp với hiệu ứng làm mờ nhẹ hậu cảnh (backdrop blur). Spinner xuất hiện bất cứ khi nào có hành động gửi biểu mẫu, tải danh sách nhật ký an ninh nặng hoặc trong quá trình kỹ sư tải ảnh chụp thiết bị lên máy chủ. Việc hiển thị vòng xoay giúp giảm bớt sự sốt ruột của người dùng, đồng thời xác nhận rằng hệ thống đang hoạt động bình thường chứ không bị treo hay mất phản hồi.

[Hình ảnh: Vòng xoay loading spinner đồng bộ với thiết kế chung]

---

#### 6.7.2. Phản hồi real‑time

Với một hệ thống kiểm soát an ninh, việc phản hồi thông tin ngay lập tức (real-time) là yêu cầu tối quan trọng để đảm bảo tính an toàn và luồng phê duyệt không bị nghẽn.

##### 6.7.2.1. Cập nhật Dashboard bảo vệ qua WebSocket (không tải lại trang)
Sự đồng bộ dữ liệu lập tức giữa hành động quét thẻ của kỹ sư tại Kiosk và màn hình theo dõi của bảo vệ được thực hiện thông qua giao thức kết nối WebSocket thường trực. Khi một kỹ sư gửi yêu cầu duyệt nhanh thiết bị phần cứng tại Kiosk, dữ liệu được truyền thẳng tới server và phát sóng (broadcast) ngay lập tức đến Dashboard của bảo vệ. React sẽ cập nhật state và hiển thị thẻ yêu cầu mới trên giao diện DOM mà không đòi hỏi bảo vệ phải tải lại trang. Điều này giúp bảo vệ nắm bắt sự kiện tức thời, xử lý phê duyệt nhanh chóng, rút ngắn thời gian chờ đợi tại cửa phòng Lab từ vài phút xuống còn vài giây.

[Hình ảnh: Giao diện Dashboard bảo vệ tự động cập nhật yêu cầu phê duyệt qua WebSocket]

##### 6.7.2.2. Thông báo toast khi có sự kiện mới (check‑in/out, yêu cầu phê duyệt)
Thông báo toast là các hộp tin nhắn nhỏ xuất hiện tạm thời ở góc màn hình nhằm thông báo nhanh về trạng thái của các tác vụ ngầm. Các thẻ toast được thiết kế trượt vào từ góc trên bên phải giao diện, đi kèm âm báo nhẹ và tự động biến mất sau 4 giây (hoặc tắt khi người dùng nhấp chọn). Chúng xuất hiện khi kỹ sư thực hiện quét thẻ thành công tại Kiosk (báo "Check-in thành công"), hoặc khi có một yêu cầu phê duyệt thiết bị mới cần bảo vệ xử lý gấp. Toast giúp người dùng cập nhật thông tin quan trọng ngay lập tức dù họ đang ở bất kỳ trang nào của hệ thống mà không làm gián đoạn công việc hiện tại.

[Hình ảnh: Thông báo Toast hiển thị ở góc trên bên phải khi có sự kiện check-in thành công]

---

#### 6.7.3. Xử lý lỗi và ngoại lệ giao diện

Hệ thống được thiết kế để chịu lỗi tốt và cung cấp hướng dẫn rõ ràng cho người dùng khi các kịch bản ngoại lệ xảy ra, tránh gây bối rối trong quá trình vận hành.

##### 6.7.3.1. Thông báo lỗi form (đỏ, rõ ràng)
Khi người dùng nhập liệu sai hoặc thiếu thông tin trên các biểu mẫu, hệ thống sẽ thực hiện kiểm tra và phản hồi trực quan ngay lập tức. Viền của các ô nhập liệu bị lỗi sẽ chuyển sang màu đỏ đậm, đồng thời một đoạn văn bản hướng dẫn chi tiết (ví dụ: "Mã thiết bị không đúng định dạng", "Trường này không được để trống") sẽ xuất hiện ngay phía dưới. Thiết kế này áp dụng trên biểu mẫu khai báo thiết bị của kỹ sư và form chỉnh sửa thông tin nhân viên của Admin. Nó giúp ngăn chặn việc gửi dữ liệu không hợp lệ lên máy chủ, đồng thời định hướng người dùng sửa lỗi nhanh chóng và thân thiện hơn.

[Hình ảnh: Giao diện biểu mẫu hiển thị lỗi đỏ trực quan tại trường nhập liệu]

##### 6.7.3.2. Fallback khi mất kết nối (thông báo offline, lưu tạm)
Để đảm bảo hệ thống kiểm soát lối vào không bị tê liệt hoàn toàn khi xảy ra sự cố mạng, giao diện Kiosk được tích hợp cơ chế nhận biết trạng thái kết nối thông qua API `navigator.onLine`. Khi mất mạng, một banner cảnh báo màu vàng nổi bật với thông báo "Mất kết nối Internet - Hệ thống đang hoạt động ở chế độ ngoại tuyến" sẽ hiển thị ở đầu màn hình. Đồng thời, các lượt quét thẻ check-in/out sẽ được mã hóa và lưu tạm vào Local Storage của trình duyệt. Giao diện cũng cung cấp một nút "Đồng bộ lại" để đẩy toàn bộ dữ liệu này lên cơ sở dữ liệu ngay khi mạng được khôi phục, mang lại cảm giác tin cậy tuyệt đối cho quy trình vận hành.

[Hình ảnh: Banner thông báo chế độ offline và nút đồng bộ lại dữ liệu]

##### 6.7.3.3. Modal xác nhận trước khi thực hiện hành động quan trọng (force close, xóa)
Hộp thoại xác nhận (Confirmation Modal) được sử dụng làm lớp bảo vệ cuối cùng trước khi người dùng thực hiện các thao tác có thể gây mất mát dữ liệu hoặc làm gián đoạn hệ thống. Khi nhấn các nút như "Xóa thiết bị", "Khóa tài khoản" hoặc "Cưỡng chế checkout" (Force Checkout), một cửa sổ pop-up toàn màn hình sẽ bật lên, làm mờ toàn bộ nền phía sau để người dùng tập trung. Modal hiển thị rõ ràng câu hỏi xác nhận cùng hai nút lựa chọn rõ ràng: nút hành động nguy hiểm được tô màu đỏ và nút "Hủy bỏ". Thiết kế này tạo ra một điểm dừng tâm lý cần thiết, ngăn ngừa tối đa các hành động bấm nhầm ngoài ý muốn của người quản trị.

[Hình ảnh: Modal xác nhận đóng phiên làm việc của kỹ sư với cảnh báo màu đỏ]
