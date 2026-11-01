/** A single message. Text is rendered as a React text node, so it is escaped. */
import { formatTime } from '../../utils/formatTime.js';
import { getTheme } from '../../utils/chatThemes.js';
import { useSettings } from '../../context/SettingsContext.jsx';

const MessageBubble = ({ message, mine }) => {
  const theme = getTheme(useSettings().settings.chat_theme);
  return (
  <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-3.5 py-2 ${
        mine ? `rounded-br-md ${theme.mine} text-white` : 'rounded-bl-md border border-white/10 bg-white/[0.06] text-gray-100'
      }`}
    >
      <p className="whitespace-pre-wrap break-words text-sm !text-inherit">{message.text}</p>
      <div className={`mt-0.5 text-right text-[10px] ${mine ? theme.meta : 'text-gray-500'}`}>
        {formatTime(message.created_at)}
      </div>
    </div>
  </div>
  );
};

export default MessageBubble;
