import * as chat from "tmi";
import {tw} from 'twind'
export type Message = {
  message: string;
  key: string;
  tags: chat.ChatUserstate;
};

function sanitizeString(str: string) {
  str = str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim, "");
  return str.trim();
}

export function MessageComponent({ tags, message }: Message) {
    console.log(tags.emotes)
  return (
    <div>
      <span className={tw`text-[${tags.color}]`}>{tags["display-name"]}:</span>
      {' '}
      <span dangerouslySetInnerHTML={{__html: getMessageHTML(message, tags)}}></span>
    </div>
  );
}

const idToImage = (id: string, options?: any) => {
    return `<img src ='https://static-cdn.jtvnw.net/emoticons/v2/${id}/${
      options?.format || "default"
    }/${options?.themeMode || "light"}/${
      options?.scale || "1.0"
    }' class='twitch-emote'/>`;
  };

function idToImageComponent(id: string, options?: any) {
    return <img className={tw`inline`} src ={`https://static-cdn.jtvnw.net/emoticons/v2/${id}/${
        options?.format || "default"
      }/${options?.themeMode || "light"}/${
        options?.scale || "1.0"
      }`}/>
}

  function getMessageHTML(message: string, user: chat.ChatUserstate) {
    const { emotes } = user;
    if (!emotes) return message;
  
    // iterate of emotes to access ids and positions
    const stringReplacements = Object.entries(emotes).map(([id, positions]) => {
      // use only the first position to find out the emote key word
      const position = positions[0];
      const [start, end] = position.split("-");
      const stringToReplace = message.substring(
        parseInt(start, 10),
        parseInt(end, 10) + 1
      );
  
      return {
        stringToReplace: stringToReplace,
        replacement: idToImage(id),
      };
    });
  
    // Sanitize ahead of time
    let clean = sanitizeString(message);
  
    // generate HTML and replace all emote keywords with image elements
    const messageHTML = stringReplacements.reduce(
      (acc, { stringToReplace, replacement }) => {
        // obs browser doesn't seam to know about replaceAll
        return acc.split(stringToReplace).join(replacement);
      },
      clean
    );
  
    return messageHTML;
  }
  