/** A single message. Text is rendered as a React text node, so it is escaped. */
import { formatTime } from '../../utils/formatTime.js';

const MessageBubble = ({ message, mine }) => (
  <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${
        mine ? 'rounded-br-md bg-red-500 text-white' : 'rounded-bl-md border border-white/10 bg-white/[0.06] text-gray-100'
      }`}
    >
      <p className="whitespace-pre-wrap break-words text-sm !text-inherit">{message.text}</p>
      <div className={`mt-0.5 text-right text-[10px] ${mine ? 'text-red-100/80' : 'text-gray-500'}`}>
        {formatTime(message.created_at)}
      </div>
    </div>
  </div>
);

export default MessageBubble;
