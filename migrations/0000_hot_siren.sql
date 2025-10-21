CREATE TABLE "card_properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"type" text NOT NULL,
	"key" text NOT NULL,
	"label" text,
	"icon" text,
	"description" text,
	"value" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_relations" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_card_id" text NOT NULL,
	"to_card_id" text NOT NULL,
	"relation_type" text NOT NULL,
	"condition" json,
	"label" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"card_id" text NOT NULL,
	"response" json NOT NULL,
	"response_type" text NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"time_spent" integer,
	"is_within_time_limit" boolean DEFAULT true,
	"earned_xp" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "game_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"level_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"short_description" text NOT NULL,
	"hint" text,
	"type" text NOT NULL,
	"difficulty" text NOT NULL,
	"estimated_time" integer NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"position_x" integer NOT NULL,
	"position_y" integer NOT NULL,
	"validation" json,
	"rewards" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_levels" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"order" integer NOT NULL,
	"color" text NOT NULL,
	"icon" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"brand_id" uuid,
	"current_level" text DEFAULT 'soul' NOT NULL,
	"current_card" text DEFAULT 'soul-start' NOT NULL,
	"completed_cards" json DEFAULT '[]' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"earned_badges" json DEFAULT '[]' NOT NULL,
	"completed" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unique_card_response_idx" (
	"session_id" varchar NOT NULL,
	"card_id" text NOT NULL,
	CONSTRAINT "unique_card_response_idx_session_id_card_id_pk" PRIMARY KEY("session_id","card_id")
);
--> statement-breakpoint
CREATE TABLE "user_brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"logo" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"total_progress" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bio" text,
	"company" varchar(200),
	"position" varchar(200),
	"website" text,
	"social_links" json DEFAULT '{}',
	"skills" json DEFAULT '[]',
	"interests" json DEFAULT '[]',
	"achievements" json DEFAULT '[]',
	"total_xp" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"language" varchar(10) DEFAULT 'uk' NOT NULL,
	"theme" varchar(20) DEFAULT 'light' NOT NULL,
	"notifications" json DEFAULT '{"email": true, "push": true}' NOT NULL,
	"game_preferences" json DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"avatar" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "card_properties" ADD CONSTRAINT "card_properties_card_id_game_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."game_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_relations" ADD CONSTRAINT "card_relations_from_card_id_game_cards_id_fk" FOREIGN KEY ("from_card_id") REFERENCES "public"."game_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_relations" ADD CONSTRAINT "card_relations_to_card_id_game_cards_id_fk" FOREIGN KEY ("to_card_id") REFERENCES "public"."game_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_responses" ADD CONSTRAINT "card_responses_session_id_game_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_responses" ADD CONSTRAINT "card_responses_card_id_game_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."game_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_cards" ADD CONSTRAINT "game_cards_level_id_game_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."game_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_brand_id_user_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."user_brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_brands" ADD CONSTRAINT "user_brands_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "unique_card_response" ON "card_responses" USING btree ("session_id","card_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");