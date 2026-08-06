import { Star } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

export default function ReviewsPage() {
  return (
    <PlaceholderPage
      icon={Star}
      title="Đánh giá"
      subtitle="Quản lý đánh giá của khách hàng"
      badge="Tính năng đánh giá đang phát triển"
      description="Tại đây sẽ hiển thị danh sách đánh giá của khách hàng về sách, bao gồm số sao, nội dung nhận xét và phản hồi của quản trị viên. Tính năng này sẽ sớm được bổ sung."
    />
  );
}
