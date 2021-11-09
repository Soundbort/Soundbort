import Discord from "discord.js";

import { SAMPLE_TYPES } from "../../../const";
import SampleID from "../SampleID";
import { CustomSample } from "../CustomSample";
import { StandardSample } from "../StandardSample";

export const STANDARD_SAMPLE_PREFIX = "%";

export async function findOne(
    name: string,
    userId: Discord.Snowflake,
    guildId?: Discord.Snowflake | null,
    scope?: SAMPLE_TYPES.USER | SAMPLE_TYPES.SERVER | SAMPLE_TYPES.STANDARD | null,
): Promise<CustomSample | StandardSample | undefined> {
    let sample: CustomSample | StandardSample | undefined;

    if (!scope) {
        // put ID check first, because of autocorrect it's more likely to have an ID as input
        if (SampleID.isId(name)) {
            sample = await CustomSample.findById(name);
        }
        // for the autocomplete, prepend standard sample names with a %, so they are not overriden by
        // custom samples with the same name => making sure it's being played what was selected
        if (!sample) {
            if (name.startsWith(STANDARD_SAMPLE_PREFIX)) {
                sample = await StandardSample.findByName(name.slice(STANDARD_SAMPLE_PREFIX.length));
            } else {
                sample = await CustomSample.findByName(guildId ?? null, userId, name) ||
                        await StandardSample.findByName(name);
            }
        }

        return sample;
    }

    switch (scope) {
        case SAMPLE_TYPES.USER:
            sample = await CustomSample.findSampleUser(userId, name);
            break;
        case SAMPLE_TYPES.SERVER:
            if (guildId) {
                sample = await CustomSample.findSampleGuild(guildId, name);
            }
            break;
        case SAMPLE_TYPES.STANDARD:
            sample = await StandardSample.findByName(name);
            break;
    }

    if (!sample && SampleID.isId(name)) {
        sample = await CustomSample.findById(name);
    }

    return sample;
}
