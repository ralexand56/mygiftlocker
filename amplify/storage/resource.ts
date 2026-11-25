import { defineStorage } from "@aws-amplify/backend";

/**
 * Private photos of the people in someone's locker (at most 5 each), used for gift ideas.
 * Each signed-in user can only read and write under their own identity folder. The gift-ideas
 * function never reads the bucket directly: the browser hands it short-lived signed URLs,
 * which proves the caller could read those photos.
 */
export const storage = defineStorage({
  name: "personPhotos",
  access: (allow) => ({
    "person-photos/{entity_id}/*": [allow.entity("identity").to(["read", "write", "delete"])],
  }),
});
