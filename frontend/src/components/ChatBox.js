import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";

import { useChimesConfig } from "../context/ChimesConfigContext";
import { typeMessage } from "../utils/typeMessage";
import {
  onReceiveMessage,
  offReceiveMessage,
  onUserTyping,
  offUserTyping,
  onNewConfederate,
  offNewConfederate,
  onChatCleared,
  offChatCleared,
  sendMessage,
  typing,
  clearChat,
  getChimes,
  telemetryEvent,
} from "../realtime/game";

const ChatBox = forwardRef(function ChatBox(
  { currentUser, isAdmin, messageRef, chatRef, confederateNameRef, activityRef, sendButtonRef, disabled, className },
  ref
) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const [confederateName, setConfederateName] = useState(t('player_name'));
  const { chimesConfig } = useChimesConfig();
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const typingTimeoutRef = useRef(null);
  const chatBodyRef = useRef(null);

  useEffect(() => {
    const updateMousePosition = (e) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", updateMousePosition);

    const handleReceiveMessage = (msg) => {
      setTypingUser("");
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
      setMessages((prevMessages) => [...prevMessages, msg]);
      let messageFromOtherUser = isAdmin ? msg.user !== confederateName : msg.user !== currentUser;

      if (messageFromOtherUser && chimesConfig?.messageReceived) {
        try {
          new Audio("/sounds/message-received.mp3").play();
        } catch (error) {
          console.error("Failed to play audio:", error);
        }
      }
    };

    const handleUserTyping = (username) => {
      setTypingUser(username);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingUser(""), 1000);
    };

    const handleNewConfederate = (name) => {
      setConfederateName(name);
    };

    const handleChatCleared = () => {
      setMessages([]);
    };

    onReceiveMessage(handleReceiveMessage);
    onUserTyping(handleUserTyping);
    onNewConfederate(handleNewConfederate);
    onChatCleared(handleChatCleared);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      offReceiveMessage(handleReceiveMessage);
      offUserTyping(handleUserTyping);
      offNewConfederate(handleNewConfederate);
      offChatCleared(handleChatCleared);
    };
  }, [currentUser, chimesConfig, confederateName, isAdmin]);

  const scrollToBottom = () => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    getChimes();
  }, []);

  const handleSend = () => {
    if (newMessage.trim() === "") return;

    const messageObj = {
      user: isAdmin ? confederateName : currentUser,
      text: newMessage,
      timeStamp: new Date().toISOString(),
    };
    
    sendMessage(messageObj);
    
    if (!isAdmin) {
      if (typingUser !== "") {
        telemetryEvent({
          user: currentUser,
          confederate: confederateName,
          action: "INTERRUPT",
          text: newMessage,
          timestamp: new Date().toISOString(),
          x: mousePositionRef.current.x,
          y: mousePositionRef.current.y,
        });
      }
      telemetryEvent({
        user: currentUser,
        confederate: confederateName,
        action: "message sent",
        text: newMessage,
        timestamp: new Date().toISOString(),
        x: mousePositionRef.current.x,
        y: mousePositionRef.current.y,
      });
    }
    else {
      telemetryEvent({
        user: confederateName,
        confederate: currentUser,
        action: "CONFEDERATE MESSAGE",
        text: newMessage,
        timestamp: new Date().toISOString(),
        x: mousePositionRef.current.x,
        y: mousePositionRef.current.y,
      });
    }

    setNewMessage("");

    if (chimesConfig?.messageSent)
      try {
        new Audio("/sounds/message-sent.mp3").play();
      } catch (error) {
        console.error("Failed to play audio:", error);
      }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const handleClearChat = () => {
    clearChat();
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    typing(isAdmin ? confederateName : currentUser);
    if (!isAdmin)
      telemetryEvent({
        user: currentUser,
        confederate: confederateName,
        action: "edit",
        text: e.target.value,
        timestamp: new Date().toISOString(),
        x: mousePositionRef.current.x,
        y: mousePositionRef.current.y,
      });
  };

  useImperativeHandle(ref, () => ({
    startTypingSimulation: (text, delay) => {
      typeMessage(text, {
        delay,
        onCharacter: (partial) => {
          typing(isAdmin ? confederateName : currentUser);
          setNewMessage(partial);
        },
      });
    },
  }), [confederateName, currentUser, isAdmin]);

  return (
    <div className={className ?? "col-md-6"}>
      <div className="card">
        <div className="card-header">
          <h3 className="h5 mb-0">{t('messages')}</h3>
        </div>
        <div className="card-body custom-scroll"
          style={{
            maxHeight: '500px',
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingRight: '10px',
          }}
          ref={(el) => {
            chatBodyRef.current = el;
            if (chatRef) chatRef.current = el;
          }}>
          {confederateName && <p className="info-box" ref={confederateNameRef}>{isAdmin ? currentUser : confederateName}</p>}
          <div className="mb-3" data-testid="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className="mb-2">
                <strong>{msg.user}:</strong> {msg.text}
              </div>
            ))}
          </div>
          <div>
            <strong ref={activityRef}>{t('activity')}:</strong>{' '}
            {typingUser && (
              <nobr className="text-muted" data-testid="typing-indicator">{typingUser} {t('is_typing')}</nobr>
            )}
            <br></br>
            <p className="info-box">{isAdmin ? confederateName : currentUser}</p>
          </div>
        </div>
        <div className="card-footer">
          <div className="input-group">
            <input
              type="text"
              className="form-control me-2"
              placeholder={t('message_placeholder')}
              data-testid="chat-input"
              value={newMessage}
              onChange={(e) => handleTyping(e)}
              onKeyUp={handleKeyPress}
              ref={messageRef}
              disabled={disabled}
            />
            <button
              className="btn btn-primary"
              data-testid="send-button"
              onClick={handleSend}
              ref={sendButtonRef}
              disabled={disabled}>
              {t('send_message')}
            </button>
            {isAdmin && (
              <button
                className="btn btn-warning ms-2"
                data-testid="clear-chat-btn"
                onClick={handleClearChat}
              >
                {t('clear_chat')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ChatBox;