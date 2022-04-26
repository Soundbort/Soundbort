import { createAttachmentOption } from "./attachment";
import { createBooleanOption } from "./boolean";
import { createChannelOption } from "./channel";
import { createIntegerOption } from "./integer";
import { createMentionableOption } from "./mentionable";
import { createNumberOption } from "./number";
import { createRoleOption } from "./role";
import { createStringOption } from "./string";
import { createUserOption } from "./user";

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
