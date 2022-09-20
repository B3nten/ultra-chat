import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import * as chat from "tmi";
import { useAutoAnimate } from "auto-animate";
import {tw} from 'twind'
import {Message, MessageComponent} from '../modules/Message/index.tsx'


export default function Channel() {
  const { channel } = useParams();
  const [animate] = useAutoAnimate();

  const messageQueue = useRef<Message[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const client = new chat.Client({
      channels: [channel!],
    });
    client.connect();

    client.on("message", (channel, tags, message, self) => {
      messageQueue.current.push({
        message,
        key: message + tags["display-name"]! + new Date(),
        tags: tags
      });
    });

    const interval = setInterval(() => {
      if (messageQueue.current.length === 0) return;
      setMessages((m) => {
        const newMessages = [...m.slice(-40), ...messageQueue.current];
        messageQueue.current = [];

        setTimeout(
          //@ts-ignore // TODO: fix this
          () => window.scrollTo(0, document.body.scrollHeight + 100),
          50
        );
        return newMessages;
      });
    }, 2000);

    return () => {
      clearInterval(interval);
      client.disconnect();
    };
  }, []);

  return (
    <div ref={animate} className={tw`max-w-xl`}>
      {messages.map((m) => (
        <MessageComponent tags={m.tags} message={m.message} key={m.key} />
      ))}
    </div>
  );
}

