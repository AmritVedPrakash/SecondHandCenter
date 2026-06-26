
import { useParams } from 'react-router-dom';
import { useConversations } from '../hooks/useConversations';
import ConversationList     from '../components/chat/ConversationList';
import ChatWindow           from '../components/chat/ChatWindow';

export default function ChatDetailPage() {
  const { convId } = useParams();
  const { conversations, isLoading: listLoading } = useConversations();

  const chatHeight = 'calc(100vh - 56px)';

  return (
    <div className="flex" style={{ height: chatHeight }}>

      {/* ── Sidebar (desktop only) ── */}
      <div className="hidden md:flex flex-col w-80 lg:w-96 flex-shrink-0 border-r border-cream-200 bg-white overflow-hidden">
        <ConversationList
          conversations={conversations}
          loading={listLoading}
          selectedId={convId}
          showHeader
        />
      </div>

      {/* ── Chat window ── */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <ChatWindow convId={convId} />
      </div>
    </div>
  );
}