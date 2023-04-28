import { createAttachmentOption } from "./attachment.js";
import { createBooleanOption } from "./boolean.js";
import { createChannelOption } from "./channel.js";
import { createIntegerOption } from "./integer.js";
import { createMentionableOption } from "./mentionable.js";
import { createNumberOption } from "./number.js";
import { createRoleOption } from "./role.js";
import { createStringOption } from "./string.js";
import { createUserOption } from "./user.js";

export type CommandOptionData =
  | ReturnType<typeof createAttachmentOption>
  | ReturnType<typeof createBooleanOption>
  | ReturnType<typeof createChannelOption>
  | ReturnType<typeof createIntegerOption>
  | ReturnType<typeof createMentionableOption>
  | ReturnType<typeof createNumberOption>
  | ReturnType<typeof createRoleOption>
  | ReturnType<typeof createStringOption>
  | ReturnType<typeof createUserOption>;
