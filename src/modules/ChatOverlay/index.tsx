import * as chat from "tmi";
import { tw } from "twind";
import { useEffect, useRef, useState } from "react";
import { useParams, useHref } from "react-router-dom";
import { useAutoAnimate } from "auto-animate";
import { useQueries, useQuery } from "@tanstack/react-query";
import useAsync from "ultra/hooks/use-async.js";

type BttvEmote = {
  id: string;
  code: string;
  imageType?: string;
  userId?: string;
};

type FrankerEmote = {
  id: number
  user: {
    id: number
    name: string
    displayName: string
  }
  code: string
  images: {
    "1x": string
    "2x": string
    "3x": string
  }
  imageType: string
}

type Emote = {
  stringToReplace: string;
  replacement: React.ReactNode;
};

type Message = {
  message: string;
  key: string;
  tags: chat.ChatUserstate;
  emotes?: Emote[];
};

function MessageComponent({ tags, message, emotes }: Message) {
  return (
    <div>
      <span className={tw`text-[${tags.color}]`}>{tags["display-name"]}:</span>{" "}
      <span>
        {generateMessage(message, tags, emotes).map((el, i) => (
          <span key={i}>{el}</span>
        ))}
      </span>
    </div>
  );
}

export default function Chat() {
  const { channel } = useParams();
  const [animate] = useAutoAnimate();

  const messageQueue = useRef<Message[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const bttv = useQueries({
    queries: [
      {
        queryKey: ["get-bttv-emotes", channel],
        queryFn: useAsync(async () => {
          const res = await fetch(
            "http://localhost:8000/api/get-bttv-emotes?name=" + channel
          );
          if (!res.ok) throw new Error("Could not fetch user info");
          return res.json();
        }),
      },
      {
        queryKey: ["get-bttv-globals"],
        queryFn: useAsync(async () => {
          const res = await fetch(
            "https://api.betterttv.net/3/cached/emotes/global"
          );
          if (!res.ok) throw new Error("Could not fetch global emotes");
          return res.json();
        }),
      },
    ],
  });

  const franker = useQuery(['franker', channel], useAsync(async () => {
    const res = await fetch(`https://api.betterttv.net/3/cached/frankerfacez/users/twitch/${channel}`)
    if (!res.ok) throw new Error("Could not fetch franker emotes")
    return res.json()
  }))

  let frankerEmotes: FrankerEmote[] = []
  if(franker.data){
    frankerEmotes = Object.values(franker.data.sets).flat()
  }

  let bttvEmotes: Emote[] | undefined
  if(bttv[0].data && bttv[1].data) {
    bttvEmotes = bttv[0].data.channelEmotes.concat(bttv[1].data).concat(commonBttvEmotes).map((emote: BttvEmote) => {
      return {
        stringToReplace: emote.code,
        replacement: (
          <img
            className={tw`inline`}
            src={`ttps://cdn.betterttv.net/emote/${emote.id}/1x`}
          />
        ),
      };
    });
  }
  /*
  let howManyChunks
  while(acc > 1000){
    get length of newest chunk, add to acc and add chunk to newArray
    work backwards from newest chunk, adding each chunk to newArray and length to acc
    finish when acc > 1000
  }
  */

  useEffect(() => {
    const client = new chat.Client({
      channels: [channel!],
    });
    client.connect();

    client.on("message", (channel, tags, message, self) => {
      messageQueue.current.push({
        message,
        key: message + tags["display-name"]! + new Date(),
        tags: tags,
        emotes: generateEmotes(message, tags.emotes, bttvEmotes),
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
          10
        );
        return newMessages;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      client.disconnect();
    };
  }, []);

  return (
    <div ref={animate} className={tw`max-w-xl`}>
      {messages.map((m) => (
        <MessageComponent tags={m.tags} message={m.message} key={m.key} emotes={m.emotes} />
      ))}
    </div>
  );
}

function generateEmotes(
  message: string,
  twitchEmotes: chat.ChatUserstate["emotes"] = {},
  bttvEmotes: Emote[] | undefined
): Emote[] {
  let twitchEmoteReplacements: Emote[] = [];
  if(twitchEmotes) twitchEmoteReplacements = Object.entries(twitchEmotes).map(
    ([id, positions]) => {
      const position = positions[0];
      const [start, end] = position.split("-");
      const stringToReplace = message.substring(
        parseInt(start, 10),
        parseInt(end, 10) + 1
      );
      return {
        stringToReplace: stringToReplace,
        replacement: (
          <img
            className={tw`inline`}
            src={`https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/light/1.0`}
          />
        ),
      };
    }
  );
  if(!bttvEmotes && !twitchEmoteReplacements) return [];
  if(!bttvEmotes && twitchEmoteReplacements) return twitchEmoteReplacements;
  if(!twitchEmoteReplacements && bttvEmotes) return bttvEmotes;
  return [...twitchEmoteReplacements!, ...bttvEmotes!];
}

function sanitizeString(str: string) {
  str = str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim, "");
  return str.trim();
}

function generateMessage(
  message: string,
  tags: chat.ChatUserstate,
  emotes?: Emote[]
) {
  if (!emotes) return [sanitizeString(message)];

  const cleanMessage = sanitizeString(message);

  const formattedMessage = emotes.reduce(
    //@ts-ignore // will fix
    (acc, { stringToReplace, replacement }) => {
      //@ts-ignore // will fix
      const reduced = acc.reduce((acc, current) => {
        if (typeof current !== "string") return [...acc, current];

        const re = new RegExp(`(${stringToReplace})`, "g");
        const arr: string[] = current.split(re);

        return [
          ...acc,
          ...arr.map((el) => (el === stringToReplace ? replacement : el)),
        ];
      }, []);
      return reduced;
    },
    [cleanMessage as string | JSX.Element]
  );
  return formattedMessage as unknown as Array<string | JSX.Element>;
}
