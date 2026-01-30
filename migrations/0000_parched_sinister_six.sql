CREATE TABLE "ai_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(50) NOT NULL,
	"model" varchar(100),
	"tokens_input" integer,
	"tokens_output" integer,
	"cost_estimate" varchar(20),
	"session_id" uuid,
	"user_id" uuid,
	"endpoint" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"is_secret" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "audience_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audience_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"size" varchar(50),
	"characteristics" json DEFAULT '[]',
	"specific_needs" json DEFAULT '[]',
	"communication_style" text,
	"preferred_channels" json DEFAULT '[]',
	"persona_name" varchar(100),
	"persona_age" integer,
	"persona_job" varchar(200),
	"persona_story" text,
	"persona_quote" text,
	"persona_image_url" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audience_type_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_en" varchar(100),
	"icon" varchar(50),
	"color" varchar(20),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audience_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_en" varchar(100),
	"description" text,
	"color" varchar(20),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_ai_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"analysis_type" varchar(50) NOT NULL,
	"content" json NOT NULL,
	"score" integer,
	"insights" json,
	"recommendations" json,
	"strengths" json,
	"weaknesses" json,
	"provider" varchar(50),
	"model" varchar(100),
	"tokens_used" integer,
	"generation_time_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_analysis_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"category" varchar(50) DEFAULT 'general' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_analysis_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "brand_analysis_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"system_prompt" text NOT NULL,
	"analysis_context" text,
	"soul_criteria" text,
	"mind_criteria" text,
	"body_criteria" text,
	"scoring_scale" text,
	"balance_weight" text,
	"output_language" varchar(20) DEFAULT 'ukrainian',
	"include_recommendations" boolean DEFAULT true,
	"max_strengths" integer DEFAULT 5,
	"max_weaknesses" integer DEFAULT 5,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_standard" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_option_set_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" text NOT NULL,
	"option_set_id" uuid NOT NULL,
	"min_selections" integer DEFAULT 1 NOT NULL,
	"max_selections" integer DEFAULT 1 NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_option_sets" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"min_selection" integer DEFAULT 1 NOT NULL,
	"max_selection" integer DEFAULT 1 NOT NULL,
	"card_type_id" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_options" (
	"id" varchar PRIMARY KEY NOT NULL,
	"option_set_id" varchar NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"value" text NOT NULL,
	"icon" varchar(10),
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "card_types" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(10),
	"color" varchar(20) DEFAULT 'blue' NOT NULL,
	"validation_rules" json DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demographic_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"tier" varchar(20) DEFAULT 'standard' NOT NULL,
	"age_range" varchar(50),
	"income" varchar(100),
	"need_pain" text,
	"life_context" varchar(100),
	"awareness_level" varchar(100),
	"readiness_to_act" varchar(100),
	"barrier" text,
	"trigger" text,
	"gender" varchar(50),
	"education" varchar(100),
	"family_status" varchar(100),
	"occupation" text,
	"company_size" varchar(100),
	"industry" varchar(255),
	"company_revenue" varchar(100),
	"employee_count" varchar(100),
	"location" text,
	"city_size" varchar(100),
	"climate" varchar(100),
	"urbanization" varchar(100),
	"local_context" text,
	"values" text,
	"beliefs" text,
	"lifestyle" text,
	"interests" text,
	"fears" text,
	"triggers_psycho" text,
	"desires" text,
	"self_identification" text,
	"purchase_frequency" varchar(100),
	"usage_scenarios" text,
	"loyalty_level" varchar(100),
	"willingness_to_pay" varchar(100),
	"price_sensitivity" varchar(100),
	"interaction_channels" text,
	"purchase_triggers" text,
	"purchase_barriers" text,
	"task_to_solve" text,
	"pain_to_relieve" text,
	"desired_result" text,
	"current_alternatives" text,
	"social_role" text,
	"communities" text,
	"social_status" varchar(100),
	"influence_level" varchar(100),
	"language_symbols_codes" text,
	"current_state" varchar(100),
	"life_stage" varchar(100),
	"decision_situation" text,
	"time_season_event" text,
	"context_description" text,
	"marketing_strategy" text,
	"target_behavior" text,
	"communication_tone" varchar(100),
	"key_messages" json DEFAULT '[]',
	"color" varchar(20),
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demographic_sub_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"segment_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"characteristics" json DEFAULT '[]',
	"context_description" text,
	"specific_needs" text,
	"differentiators" text,
	"color" varchar(20),
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_brand_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"url" text NOT NULL,
	"source_type" varchar(50) NOT NULL,
	"brand_name" varchar(255),
	"soul_analysis" json,
	"mind_analysis" json,
	"body_analysis" json,
	"overall_score" integer,
	"balance_score" integer,
	"summary" text,
	"strengths" json,
	"weaknesses" json,
	"recommendations" json,
	"raw_data" json,
	"provider" varchar(50),
	"model" varchar(100),
	"tokens_used" integer,
	"generation_time_ms" integer,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "generation_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"reference_image_url" text,
	"prompt" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"brand_id" uuid,
	"asset_type" varchar(50) NOT NULL,
	"storage_key" text NOT NULL,
	"public_url" text NOT NULL,
	"thumbnail_key" text,
	"thumbnail_url" text,
	"filename" varchar(255),
	"mime_type" varchar(100),
	"size_bytes" integer,
	"width" integer,
	"height" integer,
	"alt_text" text,
	"chat_message_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merch_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"emoji" varchar(10) NOT NULL,
	"prompt" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid,
	"plan_id" integer,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'UAH' NOT NULL,
	"status" varchar(30) NOT NULL,
	"payment_method" varchar(50) DEFAULT 'monobank' NOT NULL,
	"description" text,
	"billing_period" varchar(20),
	"mono_invoice_id" varchar(100),
	"mono_payment_id" varchar(100),
	"mono_page_url" text,
	"mono_reference" varchar(100),
	"mono_failure_reason" text,
	"stripe_payment_intent_id" varchar(255),
	"metadata" json DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "persona_audience_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona_id" uuid NOT NULL,
	"audience_type_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persona_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_en" varchar(100),
	"color" varchar(20),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persona_segment_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona_id" uuid NOT NULL,
	"segment_id" uuid,
	"sub_segment_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "premium_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "premium_features_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(200) NOT NULL,
	"description" text,
	"price_monthly" integer DEFAULT 0 NOT NULL,
	"price_yearly" integer DEFAULT 0 NOT NULL,
	"currency" varchar(3) DEFAULT 'EUR' NOT NULL,
	"max_brands" integer DEFAULT 1 NOT NULL,
	"max_games_per_brand" integer DEFAULT 1 NOT NULL,
	"max_total_games" integer DEFAULT 1 NOT NULL,
	"max_storage_bytes" integer DEFAULT 104857600 NOT NULL,
	"max_media_files" integer DEFAULT 100 NOT NULL,
	"analysis_quota" integer DEFAULT 1 NOT NULL,
	"features" json DEFAULT '[]',
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"color" varchar(20) DEFAULT '#6366f1',
	"icon" varchar(50) DEFAULT 'star',
	"badge" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "target_audiences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"segment_id" uuid,
	"sub_segment_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"age_range" varchar(50),
	"gender" varchar(50),
	"location" text,
	"income" varchar(100),
	"education" varchar(100),
	"occupation" text,
	"values" json DEFAULT '[]',
	"interests" json DEFAULT '[]',
	"pain_points" json DEFAULT '[]',
	"goals" json DEFAULT '[]',
	"motivations" json DEFAULT '[]',
	"fears" json DEFAULT '[]',
	"buying_behavior" text,
	"media_consumption" json DEFAULT '[]',
	"brand_interaction" text,
	"decision_factors" json DEFAULT '[]',
	"ai_portrait" text,
	"ai_portrait_image_url" text,
	"brand_interaction_images" json DEFAULT '[]',
	"is_primary" boolean DEFAULT false NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"tagline" varchar(300),
	"mission" text,
	"vision" text,
	"values" json DEFAULT '[]',
	"brand_colors" json DEFAULT '[]',
	"typography" json DEFAULT '{}',
	"voice_tone" json DEFAULT '{}',
	"target_audience" text,
	"competitors" json DEFAULT '[]',
	"unique_value" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"total_progress" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_media_quotas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"max_total_bytes" integer DEFAULT 104857600 NOT NULL,
	"used_bytes" integer DEFAULT 0 NOT NULL,
	"max_files" integer DEFAULT 100 NOT NULL,
	"used_files" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_media_quotas_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"avatar_url" text,
	"bio" text,
	"company" varchar(200),
	"position" varchar(200),
	"industry" varchar(100),
	"employee_count" varchar(50),
	"website" text,
	"social_links" json DEFAULT '{}',
	"skills" json DEFAULT '[]',
	"interests" json DEFAULT '[]',
	"achievements" json DEFAULT '[]',
	"total_xp" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"onboarding_skipped" boolean DEFAULT false NOT NULL,
	"gemini_api_key" text,
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
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" integer NOT NULL,
	"billing_period" varchar(20) DEFAULT 'monthly' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"cancelled_at" timestamp,
	"trial_ends_at" timestamp,
	"payment_method" varchar(50),
	"last_payment_at" timestamp,
	"next_payment_at" timestamp,
	"billing_retry_count" integer DEFAULT 0 NOT NULL,
	"billing_grace_until" timestamp,
	"last_billing_error" text,
	"last_billing_attempt" timestamp,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"mono_card_token" varchar(255),
	"mono_subscription_id" varchar(255),
	"metadata" json DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255),
	"password_hash" varchar(255),
	"first_name" varchar(100),
	"last_name" varchar(100),
	"avatar" text,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"google_id" varchar(255),
	"apple_id" varchar(255),
	"auth_provider" varchar(50) DEFAULT 'email',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_apple_id_unique" UNIQUE("apple_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_session_id_game_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audience_segments" ADD CONSTRAINT "audience_segments_audience_id_target_audiences_id_fk" FOREIGN KEY ("audience_id") REFERENCES "public"."target_audiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audience_types" ADD CONSTRAINT "audience_types_category_id_audience_type_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."audience_type_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_ai_analyses" ADD CONSTRAINT "brand_ai_analyses_brand_id_user_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."user_brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_ai_analyses" ADD CONSTRAINT "brand_ai_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_option_set_links" ADD CONSTRAINT "card_option_set_links_card_id_game_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."game_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_option_set_links" ADD CONSTRAINT "card_option_set_links_option_set_id_card_option_sets_id_fk" FOREIGN KEY ("option_set_id") REFERENCES "public"."card_option_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_options" ADD CONSTRAINT "card_options_option_set_id_card_option_sets_id_fk" FOREIGN KEY ("option_set_id") REFERENCES "public"."card_option_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_properties" ADD CONSTRAINT "card_properties_card_id_game_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."game_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_relations" ADD CONSTRAINT "card_relations_from_card_id_game_cards_id_fk" FOREIGN KEY ("from_card_id") REFERENCES "public"."game_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_relations" ADD CONSTRAINT "card_relations_to_card_id_game_cards_id_fk" FOREIGN KEY ("to_card_id") REFERENCES "public"."game_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_responses" ADD CONSTRAINT "card_responses_session_id_game_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_responses" ADD CONSTRAINT "card_responses_card_id_game_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."game_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demographic_segments" ADD CONSTRAINT "demographic_segments_brand_id_user_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."user_brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demographic_sub_segments" ADD CONSTRAINT "demographic_sub_segments_segment_id_demographic_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."demographic_segments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_brand_analyses" ADD CONSTRAINT "external_brand_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_cards" ADD CONSTRAINT "game_cards_level_id_game_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."game_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_brand_id_user_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."user_brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_brand_id_user_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."user_brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_chat_message_id_ai_chat_messages_id_fk" FOREIGN KEY ("chat_message_id") REFERENCES "public"."ai_chat_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_audience_types" ADD CONSTRAINT "persona_audience_types_persona_id_target_audiences_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."target_audiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_audience_types" ADD CONSTRAINT "persona_audience_types_audience_type_id_audience_types_id_fk" FOREIGN KEY ("audience_type_id") REFERENCES "public"."audience_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_segment_assignments" ADD CONSTRAINT "persona_segment_assignments_persona_id_target_audiences_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."target_audiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_segment_assignments" ADD CONSTRAINT "persona_segment_assignments_segment_id_demographic_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."demographic_segments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_segment_assignments" ADD CONSTRAINT "persona_segment_assignments_sub_segment_id_demographic_sub_segments_id_fk" FOREIGN KEY ("sub_segment_id") REFERENCES "public"."demographic_sub_segments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_audiences" ADD CONSTRAINT "target_audiences_brand_id_user_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."user_brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_audiences" ADD CONSTRAINT "target_audiences_segment_id_demographic_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."demographic_segments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_audiences" ADD CONSTRAINT "target_audiences_sub_segment_id_demographic_sub_segments_id_fk" FOREIGN KEY ("sub_segment_id") REFERENCES "public"."demographic_sub_segments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_brands" ADD CONSTRAINT "user_brands_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_media_quotas" ADD CONSTRAINT "user_media_quotas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audience_segments_audience_id_idx" ON "audience_segments" USING btree ("audience_id");--> statement-breakpoint
CREATE INDEX "audience_types_category_idx" ON "audience_types" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "brand_ai_analyses_brand_id_idx" ON "brand_ai_analyses" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "brand_ai_analyses_user_id_idx" ON "brand_ai_analyses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "brand_ai_analyses_created_at_idx" ON "brand_ai_analyses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "unique_card_response" ON "card_responses" USING btree ("session_id","card_id");--> statement-breakpoint
CREATE INDEX "demographic_segments_brand_id_idx" ON "demographic_segments" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "demographic_sub_segments_segment_id_idx" ON "demographic_sub_segments" USING btree ("segment_id");--> statement-breakpoint
CREATE INDEX "external_brand_analyses_user_id_idx" ON "external_brand_analyses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "external_brand_analyses_status_idx" ON "external_brand_analyses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "external_brand_analyses_created_at_idx" ON "external_brand_analyses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "media_assets_user_id_idx" ON "media_assets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "media_assets_brand_id_idx" ON "media_assets" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "media_assets_asset_type_idx" ON "media_assets" USING btree ("asset_type");--> statement-breakpoint
CREATE INDEX "payment_history_user_id_idx" ON "payment_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_history_mono_invoice_idx" ON "payment_history" USING btree ("mono_invoice_id");--> statement-breakpoint
CREATE INDEX "payment_history_status_idx" ON "payment_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "persona_audience_types_persona_idx" ON "persona_audience_types" USING btree ("persona_id");--> statement-breakpoint
CREATE INDEX "persona_audience_types_type_idx" ON "persona_audience_types" USING btree ("audience_type_id");--> statement-breakpoint
CREATE INDEX "persona_audience_types_unique" ON "persona_audience_types" USING btree ("persona_id","audience_type_id");--> statement-breakpoint
CREATE INDEX "persona_segment_persona_idx" ON "persona_segment_assignments" USING btree ("persona_id");--> statement-breakpoint
CREATE INDEX "persona_segment_segment_idx" ON "persona_segment_assignments" USING btree ("segment_id");--> statement-breakpoint
CREATE INDEX "persona_segment_sub_segment_idx" ON "persona_segment_assignments" USING btree ("sub_segment_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "target_audiences_brand_id_idx" ON "target_audiences" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "user_subscriptions_user_id_idx" ON "user_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_subscriptions_plan_id_idx" ON "user_subscriptions" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "user_subscriptions_status_idx" ON "user_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_google_id_idx" ON "users" USING btree ("google_id");--> statement-breakpoint
CREATE INDEX "users_apple_id_idx" ON "users" USING btree ("apple_id");