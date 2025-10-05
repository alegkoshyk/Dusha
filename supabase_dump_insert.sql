--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (63f4182)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_brands DROP CONSTRAINT IF EXISTS user_brands_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.game_sessions DROP CONSTRAINT IF EXISTS game_sessions_brand_id_fkey;
ALTER TABLE IF EXISTS ONLY public.game_cards DROP CONSTRAINT IF EXISTS game_cards_level_id_game_levels_id_fk;
ALTER TABLE IF EXISTS ONLY public.card_responses DROP CONSTRAINT IF EXISTS card_responses_session_id_game_sessions_id_fk;
ALTER TABLE IF EXISTS ONLY public.card_responses DROP CONSTRAINT IF EXISTS card_responses_card_id_game_cards_id_fk;
ALTER TABLE IF EXISTS ONLY public.card_relations DROP CONSTRAINT IF EXISTS card_relations_to_card_id_game_cards_id_fk;
ALTER TABLE IF EXISTS ONLY public.card_relations DROP CONSTRAINT IF EXISTS card_relations_from_card_id_game_cards_id_fk;
ALTER TABLE IF EXISTS ONLY public.card_properties DROP CONSTRAINT IF EXISTS card_properties_card_id_game_cards_id_fk;
ALTER TABLE IF EXISTS ONLY public.card_options DROP CONSTRAINT IF EXISTS card_options_option_set_id_fkey;
ALTER TABLE IF EXISTS ONLY public.card_option_set_links DROP CONSTRAINT IF EXISTS card_option_set_links_option_set_id_fkey;
ALTER TABLE IF EXISTS ONLY public.card_option_set_links DROP CONSTRAINT IF EXISTS card_option_set_links_card_id_fkey;
DROP INDEX IF EXISTS public.users_email_idx;
DROP INDEX IF EXISTS public.unique_session_card_response;
DROP INDEX IF EXISTS public.idx_session_expire;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.user_settings DROP CONSTRAINT IF EXISTS user_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.user_brands DROP CONSTRAINT IF EXISTS user_brands_pkey;
ALTER TABLE IF EXISTS ONLY public.unique_card_response_idx DROP CONSTRAINT IF EXISTS unique_card_response_idx_session_id_card_id_pk;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.game_sessions DROP CONSTRAINT IF EXISTS game_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.game_levels DROP CONSTRAINT IF EXISTS game_levels_pkey;
ALTER TABLE IF EXISTS ONLY public.game_cards DROP CONSTRAINT IF EXISTS game_cards_pkey;
ALTER TABLE IF EXISTS ONLY public.card_responses DROP CONSTRAINT IF EXISTS card_responses_pkey;
ALTER TABLE IF EXISTS ONLY public.card_relations DROP CONSTRAINT IF EXISTS card_relations_pkey;
ALTER TABLE IF EXISTS ONLY public.card_properties DROP CONSTRAINT IF EXISTS card_properties_pkey;
ALTER TABLE IF EXISTS ONLY public.card_options DROP CONSTRAINT IF EXISTS card_options_pkey;
ALTER TABLE IF EXISTS ONLY public.card_option_sets DROP CONSTRAINT IF EXISTS card_option_sets_pkey;
ALTER TABLE IF EXISTS ONLY public.card_option_set_links DROP CONSTRAINT IF EXISTS card_option_set_links_pkey;
ALTER TABLE IF EXISTS ONLY public.card_option_set_links DROP CONSTRAINT IF EXISTS card_option_set_links_card_id_option_set_id_key;
ALTER TABLE IF EXISTS public.card_responses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.card_relations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.card_properties ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_settings;
DROP TABLE IF EXISTS public.user_profiles;
DROP TABLE IF EXISTS public.user_brands;
DROP TABLE IF EXISTS public.unique_card_response_idx;
DROP TABLE IF EXISTS public.sessions;
DROP TABLE IF EXISTS public.game_sessions;
DROP TABLE IF EXISTS public.game_levels;
DROP TABLE IF EXISTS public.game_cards;
DROP SEQUENCE IF EXISTS public.card_responses_id_seq;
DROP TABLE IF EXISTS public.card_responses;
DROP SEQUENCE IF EXISTS public.card_relations_id_seq;
DROP TABLE IF EXISTS public.card_relations;
DROP SEQUENCE IF EXISTS public.card_properties_id_seq;
DROP TABLE IF EXISTS public.card_properties;
DROP TABLE IF EXISTS public.card_options;
DROP TABLE IF EXISTS public.card_option_sets;
DROP TABLE IF EXISTS public.card_option_set_links;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: card_option_set_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_option_set_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    card_id text NOT NULL,
    option_set_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: card_option_sets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_option_sets (
    id character varying NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    min_selection integer DEFAULT 1 NOT NULL,
    max_selection integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    card_type_id character varying,
    is_active boolean DEFAULT true
);


--
-- Name: card_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_options (
    id character varying NOT NULL,
    option_set_id character varying NOT NULL,
    icon character varying(10),
    name character varying(200) NOT NULL,
    description text,
    value text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true
);


--
-- Name: card_properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_properties (
    id integer NOT NULL,
    card_id text NOT NULL,
    type text NOT NULL,
    key text NOT NULL,
    label text,
    icon text,
    description text,
    value json,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: card_properties_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.card_properties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: card_properties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.card_properties_id_seq OWNED BY public.card_properties.id;


--
-- Name: card_relations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_relations (
    id integer NOT NULL,
    from_card_id text NOT NULL,
    to_card_id text NOT NULL,
    relation_type text NOT NULL,
    condition json,
    label text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: card_relations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.card_relations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: card_relations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.card_relations_id_seq OWNED BY public.card_relations.id;


--
-- Name: card_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_responses (
    id integer NOT NULL,
    session_id character varying NOT NULL,
    card_id text NOT NULL,
    response json NOT NULL,
    response_type text NOT NULL,
    submitted_at timestamp without time zone DEFAULT now() NOT NULL,
    started_at timestamp without time zone DEFAULT now(),
    time_spent integer,
    is_within_time_limit boolean DEFAULT true,
    earned_xp integer DEFAULT 0
);


--
-- Name: card_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.card_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: card_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.card_responses_id_seq OWNED BY public.card_responses.id;


--
-- Name: game_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_cards (
    id text NOT NULL,
    level_id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    short_description text NOT NULL,
    hint text,
    type text NOT NULL,
    difficulty text NOT NULL,
    estimated_time integer NOT NULL,
    required boolean DEFAULT true NOT NULL,
    position_x integer NOT NULL,
    position_y integer NOT NULL,
    validation json,
    rewards json,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    validation_rules text
);


--
-- Name: game_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_levels (
    id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    "order" integer NOT NULL,
    color text NOT NULL,
    icon text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: game_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_sessions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id text,
    current_level text DEFAULT 'soul'::text NOT NULL,
    current_card text DEFAULT 'soul-start'::text NOT NULL,
    completed_cards json DEFAULT '[]'::json NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    total_xp integer DEFAULT 0 NOT NULL,
    earned_badges json DEFAULT '[]'::json NOT NULL,
    completed timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    brand_id uuid
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: unique_card_response_idx; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unique_card_response_idx (
    session_id character varying NOT NULL,
    card_id text NOT NULL
);


--
-- Name: user_brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_brands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    logo text,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    total_progress integer DEFAULT 0 NOT NULL,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    bio text,
    company character varying(200),
    "position" character varying(200),
    website text,
    social_links json DEFAULT '{}'::json,
    skills json DEFAULT '[]'::json,
    interests json DEFAULT '[]'::json,
    achievements json DEFAULT '[]'::json,
    total_xp integer DEFAULT 0 NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    language character varying(10) DEFAULT 'uk'::character varying NOT NULL,
    theme character varying(20) DEFAULT 'light'::character varying NOT NULL,
    notifications json DEFAULT '{"email": true, "push": true}'::json NOT NULL,
    game_preferences json DEFAULT '{}'::json NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    avatar text,
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying
);


--
-- Name: card_properties id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_properties ALTER COLUMN id SET DEFAULT nextval('public.card_properties_id_seq'::regclass);


--
-- Name: card_relations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_relations ALTER COLUMN id SET DEFAULT nextval('public.card_relations_id_seq'::regclass);


--
-- Name: card_responses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_responses ALTER COLUMN id SET DEFAULT nextval('public.card_responses_id_seq'::regclass);


--
-- Data for Name: card_option_set_links; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.card_option_set_links (id, card_id, option_set_id, created_at) VALUES ('1a867c68-a610-4231-8478-121f33d2caf8', 'soul-archetype', 'brand-archetypes', '2025-08-23 15:00:52.436612');
INSERT INTO public.card_option_set_links (id, card_id, option_set_id, created_at) VALUES ('7c189087-bae6-425f-b674-160e563c87a7', 'mind-archetype', 'mind-archetypes', '2025-08-23 15:00:52.436612');


--
-- Data for Name: card_option_sets; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.card_option_sets (id, name, description, min_selection, max_selection, created_at, updated_at, card_type_id, is_active) VALUES ('communication-channels', 'Канали комунікації', 'Через які канали ви будете спілкуватися з аудиторією?', 1, 5, '2025-08-23 11:49:15.653894', '2025-08-23 11:49:15.653894', NULL, true);
INSERT INTO public.card_option_sets (id, name, description, min_selection, max_selection, created_at, updated_at, card_type_id, is_active) VALUES ('tone-voice', 'Тон голосу', 'Оберіть тон голосу для комунікації вашого бренду', 1, 2, '2025-08-23 11:49:21.458599', '2025-08-23 11:49:21.458599', NULL, true);
INSERT INTO public.card_option_sets (id, name, description, min_selection, max_selection, created_at, updated_at, card_type_id, is_active) VALUES ('pricing-strategies', 'Стратегії ціноутворення', 'Як ви плануєте встановлювати ціни на ваші продукти/послуги?', 1, 3, '2025-08-23 11:49:37.665845', '2025-08-23 11:49:37.665845', NULL, true);
INSERT INTO public.card_option_sets (id, name, description, min_selection, max_selection, created_at, updated_at, card_type_id, is_active) VALUES ('success-metrics', 'Метрики успіху', 'Оберіть ключові метрики для вимірювання успіху бренду', 2, 5, '2025-08-23 11:52:55.178839', '2025-08-23 11:52:55.178839', NULL, true);
INSERT INTO public.card_option_sets (id, name, description, min_selection, max_selection, created_at, updated_at, card_type_id, is_active) VALUES ('brand-values', 'Цінності бренду', 'Основні цінності та принципи бренду', 2, 5, '2025-08-23 12:07:48.331176', '2025-08-23 12:07:48.331176', NULL, true);
INSERT INTO public.card_option_sets (id, name, description, min_selection, max_selection, created_at, updated_at, card_type_id, is_active) VALUES ('products-services', 'Продукти та послуги', 'Основні продукти чи послуги бренду', 1, 10, '2025-08-23 11:48:51.629341', '2025-08-23 14:56:43.988', NULL, true);
INSERT INTO public.card_option_sets (id, name, description, min_selection, max_selection, created_at, updated_at, card_type_id, is_active) VALUES ('mind-archetypes', 'Архетипи для розуму', 'Архетипи для стратегічного позиціонування бренду', 1, 3, '2025-08-23 14:59:55.130877', '2025-08-23 14:59:55.130877', NULL, true);
INSERT INTO public.card_option_sets (id, name, description, min_selection, max_selection, created_at, updated_at, card_type_id, is_active) VALUES ('brand-archetypes', 'Архетипи для душі', 'Архетипи для внутрішньої ідентичності бренду', 1, 3, '2025-08-23 12:07:39.053389', '2025-08-23 14:59:58.838289', NULL, true);


--
-- Data for Name: card_options; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('product-physical', 'products-services', '📦', 'Фізичні товари', 'Матеріальні продукти для клієнтів', 'physical', 1, '2025-08-23 11:48:51.629341', '2025-08-23 11:48:51.629341', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('product-digital', 'products-services', '💻', 'Цифрові продукти', 'Програми, додатки, онлайн-сервіси', 'digital', 2, '2025-08-23 11:48:51.629341', '2025-08-23 11:48:51.629341', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('service-consulting', 'products-services', '🤝', 'Послуги', 'Консультації, обслуговування, підтримка', 'services', 3, '2025-08-23 11:48:51.629341', '2025-08-23 11:48:51.629341', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('service-subscription', 'products-services', '📋', 'Підписки', 'Регулярні платежі за доступ', 'subscription', 4, '2025-08-23 11:48:51.629341', '2025-08-23 11:48:51.629341', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('service-education', 'products-services', '🎓', 'Освіта', 'Курси, тренінги, навчальні матеріали', 'education', 5, '2025-08-23 11:48:51.629341', '2025-08-23 11:48:51.629341', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('service-ecommerce', 'products-services', '🛒', 'Інтернет-магазин', 'Онлайн продаж товарів', 'ecommerce', 6, '2025-08-23 11:48:51.629341', '2025-08-23 11:48:51.629341', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('service-saas', 'products-services', '☁️', 'SaaS продукти', 'Програмне забезпечення як послуга', 'saas', 7, '2025-08-23 11:48:51.629341', '2025-08-23 11:48:51.629341', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('service-marketplace', 'products-services', '👥', 'Маркетплейс', 'Платформа для покупців та продавців', 'marketplace', 8, '2025-08-23 11:48:51.629341', '2025-08-23 11:48:51.629341', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('service-consulting-expert', 'products-services', '💡', 'Консалтинг', 'Експертні поради та стратегії', 'consulting', 9, '2025-08-23 11:48:51.629341', '2025-08-23 11:48:51.629341', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('service-manufacturing', 'products-services', '🏭', 'Виробництво', 'Створення фізичних товарів', 'manufacturing', 10, '2025-08-23 11:48:51.629341', '2025-08-23 11:48:51.629341', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('channel-social', 'communication-channels', '📱', 'Соціальні мережі', 'Instagram, Facebook, TikTok, LinkedIn', 'social', 1, '2025-08-23 11:49:15.653894', '2025-08-23 11:49:15.653894', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('channel-website', 'communication-channels', '🌐', 'Вебсайт', 'Корпоративний сайт та блог', 'website', 2, '2025-08-23 11:49:15.653894', '2025-08-23 11:49:15.653894', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('channel-email', 'communication-channels', '📧', 'Email маркетинг', 'Розсилки та персональні листи', 'email', 3, '2025-08-23 11:49:15.653894', '2025-08-23 11:49:15.653894', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('channel-advertising', 'communication-channels', '📺', 'Реклама', 'Телебачення, радіо, зовнішня реклама', 'advertising', 4, '2025-08-23 11:49:15.653894', '2025-08-23 11:49:15.653894', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('channel-events', 'communication-channels', '🎪', 'Заходи', 'Конференції, виставки, презентації', 'events', 5, '2025-08-23 11:49:15.653894', '2025-08-23 11:49:15.653894', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('channel-pr', 'communication-channels', '📰', 'PR і медіа', 'Преса, інтерв''ю, прес-релізи', 'pr', 6, '2025-08-23 11:49:15.653894', '2025-08-23 11:49:15.653894', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('channel-partnerships', 'communication-channels', '🤝', 'Партнерства', 'Співпраця з іншими брендами', 'partnerships', 7, '2025-08-23 11:49:15.653894', '2025-08-23 11:49:15.653894', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('channel-direct', 'communication-channels', '🛍️', 'Прямі продажі', 'Безпосередній контакт з клієнтами', 'direct', 8, '2025-08-23 11:49:15.653894', '2025-08-23 11:49:15.653894', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('channel-content', 'communication-channels', '📹', 'Контент маркетинг', 'Блоги, відео, подкасти', 'content', 9, '2025-08-23 11:49:15.653894', '2025-08-23 11:49:15.653894', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('channel-influencer', 'communication-channels', '⭐', 'Інфлюенсер маркетинг', 'Співпраця з лідерами думок', 'influencer', 10, '2025-08-23 11:49:15.653894', '2025-08-23 11:49:15.653894', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('tone-friendly', 'tone-voice', '😊', 'Дружний', 'Тепле та доступне спілкування', 'friendly', 1, '2025-08-23 11:49:21.458599', '2025-08-23 11:49:21.458599', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('tone-professional', 'tone-voice', '💼', 'Професійний', 'Офіційний та компетентний тон', 'professional', 2, '2025-08-23 11:49:21.458599', '2025-08-23 11:49:21.458599', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('tone-casual', 'tone-voice', '😎', 'Незвмушений', 'Розслаблений та природний стиль', 'casual', 3, '2025-08-23 11:49:21.458599', '2025-08-23 11:49:21.458599', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('tone-authoritative', 'tone-voice', '🎯', 'Авторитетний', 'Впевнений та експертний підхід', 'authoritative', 4, '2025-08-23 11:49:21.458599', '2025-08-23 11:49:21.458599', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('tone-playful', 'tone-voice', '🎮', 'Ігравий', 'Веселий та креативний тон', 'playful', 5, '2025-08-23 11:49:21.458599', '2025-08-23 11:49:21.458599', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('metric-revenue', 'success-metrics', '💰', 'Дохід', 'Загальні продажі та прибуток', 'revenue', 1, '2025-08-23 11:52:55.178839', '2025-08-23 11:52:55.178839', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('metric-customers', 'success-metrics', '👥', 'Клієнти', 'Кількість та лояльність клієнтів', 'customers', 2, '2025-08-23 11:52:55.178839', '2025-08-23 11:52:55.178839', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('metric-engagement', 'success-metrics', '💬', 'Залученість', 'Взаємодія в соціальних мережах', 'engagement', 3, '2025-08-23 11:52:55.178839', '2025-08-23 11:52:55.178839', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('metric-conversion', 'success-metrics', '✅', 'Конверсія', 'Перетворення відвідувачів на клієнтів', 'conversion', 4, '2025-08-23 11:52:55.178839', '2025-08-23 11:52:55.178839', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('metric-awareness', 'success-metrics', '🔍', 'Впізнаваність', 'Знання про бренд серед аудиторії', 'awareness', 5, '2025-08-23 11:52:55.178839', '2025-08-23 11:52:55.178839', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('pricing-economy', 'pricing-strategies', '💸', 'Економ', 'Доступні ціни для всіх', 'economy', 1, '2025-08-23 11:53:00.437037', '2025-08-23 11:53:00.437037', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('pricing-premium', 'pricing-strategies', '💎', 'Преміум', 'Високомаржні продукти за вищою ціною', 'premium', 2, '2025-08-23 11:53:00.437037', '2025-08-23 11:53:00.437037', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('pricing-luxury', 'pricing-strategies', '👑', 'Люкс', 'Ексклюзивні продукти для обраних', 'luxury', 3, '2025-08-23 11:53:00.437037', '2025-08-23 11:53:00.437037', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('pricing-competitive', 'pricing-strategies', '⚖️', 'Конкурентні', 'Оптимальне співвідношення ціна-якість', 'competitive', 4, '2025-08-23 11:53:00.437037', '2025-08-23 11:53:00.437037', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('archetype-innocent', 'brand-archetypes', '🌟', 'Невинний', 'Простота, чистота, оптимізм', 'innocent', 1, '2025-08-23 12:07:39.053389', '2025-08-23 12:07:39.053389', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('archetype-sage', 'brand-archetypes', '🧠', 'Мудрець', 'Знання, мудрість, експертиза', 'sage', 2, '2025-08-23 12:07:39.053389', '2025-08-23 12:07:39.053389', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('archetype-explorer', 'brand-archetypes', '🗺️', 'Дослідник', 'Свобода, пригоди, автентичність', 'explorer', 3, '2025-08-23 12:07:39.053389', '2025-08-23 12:07:39.053389', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('archetype-outlaw', 'brand-archetypes', '⚡', 'Бунтар', 'Революція, сила, руйнування', 'outlaw', 4, '2025-08-23 12:07:39.053389', '2025-08-23 12:07:39.053389', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('archetype-magician', 'brand-archetypes', '🎩', 'Маг', 'Трансформація, мрії, візія', 'magician', 5, '2025-08-23 12:07:39.053389', '2025-08-23 12:07:39.053389', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('archetype-hero', 'brand-archetypes', '🦸', 'Герой', 'Мужність, рішучість, тріумф', 'hero', 6, '2025-08-23 12:07:39.053389', '2025-08-23 12:07:39.053389', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('archetype-lover', 'brand-archetypes', '💕', 'Коханець', 'Любов, пристрасть, відданість', 'lover', 7, '2025-08-23 12:07:39.053389', '2025-08-23 12:07:39.053389', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('archetype-jester', 'brand-archetypes', '🤡', 'Блазень', 'Веселощі, спонтанність, радість', 'jester', 8, '2025-08-23 12:07:39.053389', '2025-08-23 12:07:39.053389', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('archetype-caregiver', 'brand-archetypes', '🤗', 'Опікун', 'Турбота, співчуття, допомога', 'caregiver', 9, '2025-08-23 12:07:39.053389', '2025-08-23 12:07:39.053389', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('archetype-creator', 'brand-archetypes', '🎨', 'Творець', 'Креативність, уява, інновації', 'creator', 10, '2025-08-23 12:07:39.053389', '2025-08-23 12:07:39.053389', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('archetype-ruler', 'brand-archetypes', '👑', 'Правитель', 'Лідерство, контроль, відповідальність', 'ruler', 11, '2025-08-23 12:07:39.053389', '2025-08-23 12:07:39.053389', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('archetype-everyman', 'brand-archetypes', '👥', 'Звичайна людина', 'Приналежність, реалізм, чесність', 'everyman', 12, '2025-08-23 12:07:39.053389', '2025-08-23 12:07:39.053389', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('value-honesty', 'brand-values', '🎯', 'Чесність', 'Прозорість та правдивість у всіх справах', 'honesty', 1, '2025-08-23 12:07:48.331176', '2025-08-23 12:07:48.331176', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('value-innovation', 'brand-values', '💡', 'Інновації', 'Постійні розвиток та нові рішення', 'innovation', 2, '2025-08-23 12:07:48.331176', '2025-08-23 12:07:48.331176', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('value-quality', 'brand-values', '⭐', 'Якість', 'Досконалість у кожній деталі', 'quality', 3, '2025-08-23 12:07:48.331176', '2025-08-23 12:07:48.331176', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('value-sustainability', 'brand-values', '🌱', 'Сталість', 'Відповідальність перед навколишнім середовищем', 'sustainability', 4, '2025-08-23 12:07:48.331176', '2025-08-23 12:07:48.331176', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('value-customer-focus', 'brand-values', '👤', 'Клієнтоцентричність', 'Пріоритет потреб та задоволення клієнтів', 'customer_focus', 5, '2025-08-23 12:07:48.331176', '2025-08-23 12:07:48.331176', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('value-teamwork', 'brand-values', '🤝', 'Командна робота', 'Співпраця та взаємопідтримка', 'teamwork', 6, '2025-08-23 12:07:48.331176', '2025-08-23 12:07:48.331176', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('value-excellence', 'brand-values', '🏆', 'Досконалість', 'Прагнення до найвищих стандартів', 'excellence', 7, '2025-08-23 12:07:48.331176', '2025-08-23 12:07:48.331176', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('value-integrity', 'brand-values', '🛡️', 'Цілісність', 'Морально-етичні принципи в діяльності', 'integrity', 8, '2025-08-23 12:07:48.331176', '2025-08-23 12:07:48.331176', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('value-accessibility', 'brand-values', '♿', 'Доступність', 'Рівні можливості для всіх', 'accessibility', 9, '2025-08-23 12:07:48.331176', '2025-08-23 12:07:48.331176', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('value-empowerment', 'brand-values', '💪', 'Розширення можливостей', 'Надання сили та можливостей іншим', 'empowerment', 10, '2025-08-23 12:07:48.331176', '2025-08-23 12:07:48.331176', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('mind-archetype-innocent', 'mind-archetypes', '🌟', 'Невинний', 'Оптимізм, довіра, чистота намірів', 'innocent', 1, '2025-08-23 14:59:55.130877', '2025-08-23 14:59:55.130877', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('mind-archetype-sage', 'mind-archetypes', '🧠', 'Мудрець', 'Знання, розуміння, істина', 'sage', 2, '2025-08-23 14:59:55.130877', '2025-08-23 14:59:55.130877', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('mind-archetype-explorer', 'mind-archetypes', '🗺️', 'Дослідник', 'Свобода, пригоди, автентичність', 'explorer', 3, '2025-08-23 14:59:55.130877', '2025-08-23 14:59:55.130877', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('mind-archetype-outlaw', 'mind-archetypes', '⚡', 'Бунтар', 'Революція, свобода, зміни', 'outlaw', 4, '2025-08-23 14:59:55.130877', '2025-08-23 14:59:55.130877', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('mind-archetype-magician', 'mind-archetypes', '🎩', 'Маг', 'Перетворення, візія, харизма', 'magician', 5, '2025-08-23 14:59:55.130877', '2025-08-23 14:59:55.130877', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('mind-archetype-hero', 'mind-archetypes', '🦸', 'Герой', 'Мужність, майстерність, тріумф', 'hero', 6, '2025-08-23 14:59:55.130877', '2025-08-23 14:59:55.130877', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('mind-archetype-lover', 'mind-archetypes', '💕', 'Коханець', 'Пристрасть, близькість, відданість', 'lover', 7, '2025-08-23 14:59:55.130877', '2025-08-23 14:59:55.130877', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('mind-archetype-jester', 'mind-archetypes', '🤡', 'Блазень', 'Веселощі, легкість, момент', 'jester', 8, '2025-08-23 14:59:55.130877', '2025-08-23 14:59:55.130877', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('mind-archetype-caregiver', 'mind-archetypes', '🤗', 'Піклувальник', 'Служіння, співчуття, щедрість', 'caregiver', 9, '2025-08-23 14:59:55.130877', '2025-08-23 14:59:55.130877', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('mind-archetype-creator', 'mind-archetypes', '🎨', 'Творець', 'Творчість, уява, артистизм', 'creator', 10, '2025-08-23 14:59:55.130877', '2025-08-23 14:59:55.130877', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('mind-archetype-ruler', 'mind-archetypes', '👑', 'Правитель', 'Відповідальність, лідерство, контроль', 'ruler', 11, '2025-08-23 14:59:55.130877', '2025-08-23 14:59:55.130877', true);
INSERT INTO public.card_options (id, option_set_id, icon, name, description, value, "order", created_at, updated_at, is_active) VALUES ('mind-archetype-everyman', 'mind-archetypes', '👥', 'Звичайна людина', 'Належність, реалізм, емпатія', 'everyman', 12, '2025-08-23 14:59:55.130877', '2025-08-23 14:59:55.130877', true);


--
-- Data for Name: card_properties; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (1, 'soul-values', 'option', 'honesty', 'Чесність', '⚖️', 'Відкритість та правдивість у всіх діях', NULL, '2025-08-18 18:57:26.590746');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (2, 'soul-values', 'option', 'quality', 'Якість', '⭐', 'Прагнення до досконалості у всьому', NULL, '2025-08-18 18:57:26.590746');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (3, 'soul-values', 'option', 'innovation', 'Інновації', '💡', 'Пошук нових рішень та ідей', NULL, '2025-08-18 18:57:26.590746');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (4, 'soul-values', 'option', 'respect', 'Повага', '🤝', 'Шанобливе ставлення до всіх людей', NULL, '2025-08-18 18:57:26.590746');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (5, 'soul-values', 'option', 'sustainability', 'Сталість', '🌱', 'Турбота про довкілля та майбутні покоління', NULL, '2025-08-18 18:57:26.590746');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (6, 'soul-values', 'option', 'teamwork', 'Командна робота', '👥', 'Співпраця заради спільної мети', NULL, '2025-08-18 18:57:26.590746');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (7, 'soul-values', 'option', 'growth', 'Розвиток', '🚀', 'Постійне вдосконалення та навчання', NULL, '2025-08-18 18:57:26.590746');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (8, 'soul-values', 'option', 'customer-first', 'Клієнт на першому місці', '❤️', 'Клієнти - основа нашого успіху', NULL, '2025-08-18 18:57:26.590746');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (9, 'soul-values', 'option', 'freedom', 'Свобода', '🕊️', 'Незалежність та право вибору', NULL, '2025-08-18 18:57:26.590746');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (10, 'soul-values', 'option', 'creativity', 'Креативність', '🎨', 'Творчий підхід до вирішення завдань', NULL, '2025-08-18 18:57:26.590746');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (11, 'mind-archetype', 'option', 'hero', 'Герой', '🦸', 'Переможець, який досягає успіху через силу волі', NULL, '2025-08-18 18:57:36.211724');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (12, 'mind-archetype', 'option', 'sage', 'Мудрець', '🧙', 'Експерт, що ділиться знаннями та мудрістю', NULL, '2025-08-18 18:57:36.211724');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (13, 'mind-archetype', 'option', 'innocent', 'Невинний', '👼', 'Чистий, простий та оптимістичний', NULL, '2025-08-18 18:57:36.211724');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (14, 'mind-archetype', 'option', 'explorer', 'Дослідник', '🧭', 'Шукає нових пригод та досвіду', NULL, '2025-08-18 18:57:36.211724');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (15, 'mind-archetype', 'option', 'rebel', 'Бунтар', '⚡', 'Руйнує старі правила заради змін', NULL, '2025-08-18 18:57:36.211724');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (16, 'mind-archetype', 'option', 'lover', 'Коханець', '💕', 'Прагне кохання, близькості та пристрасті', NULL, '2025-08-18 18:57:36.211724');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (17, 'mind-archetype', 'option', 'creator', 'Творець', '🎭', 'Створює щось нове та унікальне', NULL, '2025-08-18 18:57:36.211724');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (18, 'mind-archetype', 'option', 'jester', 'Блазень', '🎪', 'Веселить та допомагає насолодитися життям', NULL, '2025-08-18 18:57:36.211724');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (19, 'mind-archetype', 'option', 'caregiver', 'Опікун', '🤱', 'Турботується про інших та допомагає', NULL, '2025-08-18 18:57:36.211724');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (20, 'mind-archetype', 'option', 'ruler', 'Правитель', '👑', 'Лідер, що контролює та створює порядок', NULL, '2025-08-18 18:57:36.211724');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (21, 'mind-archetype', 'option', 'magician', 'Маг', '🔮', 'Трансформує реальність та втілює мрії', NULL, '2025-08-18 18:57:36.211724');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (22, 'mind-archetype', 'option', 'everyman', 'Звичайна людина', '👤', 'Зрозумілий кожному, справжній та простий', NULL, '2025-08-18 18:57:36.211724');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (23, 'body-channels', 'option', 'social-media', 'Соціальні мережі', '📱', 'Instagram, Facebook, TikTok, LinkedIn', NULL, '2025-08-18 18:57:42.127571');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (24, 'body-channels', 'option', 'website', 'Вебсайт', '🌐', 'Корпоративний сайт та блог', NULL, '2025-08-18 18:57:42.127571');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (25, 'body-channels', 'option', 'email', 'Email маркетинг', '📧', 'Розсилки та персональні листи', NULL, '2025-08-18 18:57:42.127571');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (26, 'body-channels', 'option', 'advertising', 'Реклама', '📺', 'Телебачення, радіо, зовнішня реклама', NULL, '2025-08-18 18:57:42.127571');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (27, 'body-channels', 'option', 'events', 'Заходи', '🎪', 'Конференції, виставки, презентації', NULL, '2025-08-18 18:57:42.127571');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (28, 'body-channels', 'option', 'pr', 'PR і медіа', '📰', 'Преса, інтервю, прес-релізи', NULL, '2025-08-18 18:57:42.127571');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (29, 'body-channels', 'option', 'partnerships', 'Партнерства', '🤝', 'Співпраця з іншими брендами', NULL, '2025-08-18 18:57:42.127571');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (30, 'body-channels', 'option', 'direct-sales', 'Прямі продажі', '🛍️', 'Безпосередній контакт з клієнтами', NULL, '2025-08-18 18:57:42.127571');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (31, 'body-channels', 'option', 'content', 'Контент маркетинг', '📝', 'Блоги, відео, подкасти', NULL, '2025-08-18 18:57:42.127571');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (32, 'body-channels', 'option', 'influencers', 'Інфлюенсер маркетинг', '⭐', 'Співпраця з лідерами думок', NULL, '2025-08-18 18:57:42.127571');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (33, 'soul-archetype', 'option', 'innocent', 'Невинний', '🌟', 'Оптимізм, довіра, чистота намірів', NULL, '2025-08-18 20:15:13.417763');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (34, 'soul-archetype', 'option', 'sage', 'Мудрець', '🧠', 'Знання, розуміння, істина', NULL, '2025-08-18 20:15:13.417763');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (35, 'soul-archetype', 'option', 'explorer', 'Дослідник', '🌍', 'Свобода, пригоди, автентичність', NULL, '2025-08-18 20:15:13.417763');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (36, 'soul-archetype', 'option', 'hero', 'Герой', '⚡', 'Мужність, майстерність, тріумф', NULL, '2025-08-18 20:15:13.417763');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (37, 'soul-archetype', 'option', 'rebel', 'Бунтар', '🔥', 'Революція, свобода, зміни', NULL, '2025-08-18 20:15:13.417763');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (38, 'soul-archetype', 'option', 'magician', 'Маг', '✨', 'Перетворення, візія, харизма', NULL, '2025-08-18 20:15:13.417763');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (39, 'soul-archetype', 'option', 'everyman', 'Простодушний', '👥', 'Належність, реалізм, емпатія', NULL, '2025-08-18 20:15:13.417763');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (40, 'soul-archetype', 'option', 'lover', 'Коханець', '❤️', 'Пристрасть, близькість, відданість', NULL, '2025-08-18 20:15:13.417763');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (41, 'soul-archetype', 'option', 'jester', 'Блазень', '🎭', 'Веселощі, легкість, момент', NULL, '2025-08-18 20:15:13.417763');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (42, 'soul-archetype', 'option', 'caregiver', 'Піклувальник', '🤗', 'Служіння, співчуття, щедрість', NULL, '2025-08-18 20:15:13.417763');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (43, 'soul-archetype', 'option', 'ruler', 'Правитель', '👑', 'Відповідальність, лідерство, контроль', NULL, '2025-08-18 20:15:13.417763');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (44, 'soul-archetype', 'option', 'creator', 'Творець', '🎨', 'Творчість, уява, артистизм', NULL, '2025-08-18 20:15:13.417763');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (57, 'body-pricing', 'option', 'budget', 'Економ', '💰', 'Доступні ціни для всіх', NULL, '2025-08-20 20:06:20.174673');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (58, 'body-pricing', 'option', 'premium', 'Преміум', '💎', 'Високоякісні продукти за вищою ціною', NULL, '2025-08-20 20:06:20.174673');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (59, 'body-pricing', 'option', 'luxury', 'Люкс', '👑', 'Ексклюзивні продукти для обраних', NULL, '2025-08-20 20:06:20.174673');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (60, 'body-pricing', 'option', 'competitive', 'Конкурентні', '⚔️', 'Оптимальне співвідношення ціна-якість', NULL, '2025-08-20 20:06:20.174673');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (61, 'body-tone', 'option', 'friendly', 'Дружній', '😊', 'Тепле та доступне спілкування', NULL, '2025-08-20 20:06:23.382819');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (62, 'body-tone', 'option', 'professional', 'Професійний', '👔', 'Офіційний та компетентний тон', NULL, '2025-08-20 20:06:23.382819');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (63, 'body-tone', 'option', 'casual', 'Невимушений', '😎', 'Розслаблений та природний стиль', NULL, '2025-08-20 20:06:23.382819');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (64, 'body-tone', 'option', 'authoritative', 'Авторитетний', '📊', 'Впевнений та експертний підхід', NULL, '2025-08-20 20:06:23.382819');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (65, 'body-tone', 'option', 'playful', 'Грайливий', '🎉', 'Веселий та креативний тон', NULL, '2025-08-20 20:06:23.382819');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (66, 'body-metrics', 'option', 'revenue', 'Дохід', '💰', 'Загальні продажі та прибуток', NULL, '2025-08-20 20:06:27.178673');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (67, 'body-metrics', 'option', 'customers', 'Клієнти', '👥', 'Кількість та лояльність клієнтів', NULL, '2025-08-20 20:06:27.178673');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (68, 'body-metrics', 'option', 'engagement', 'Залученість', '💬', 'Взаємодія в соціальних мережах', NULL, '2025-08-20 20:06:27.178673');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (69, 'body-metrics', 'option', 'conversion', 'Конверсія', '🎯', 'Перетворення відвідувачів на клієнтів', NULL, '2025-08-20 20:06:27.178673');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (70, 'body-metrics', 'option', 'brand-awareness', 'Впізнаваність', '👁️', 'Знання про бренд серед аудиторії', NULL, '2025-08-20 20:06:27.178673');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (71, 'body-products', 'option', 'physical', 'Фізичні товари', '📦', 'Матеріальні продукти для клієнтів', NULL, '2025-08-20 20:06:38.939005');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (72, 'body-products', 'option', 'digital', 'Цифрові продукти', '💻', 'Програми, додатки, онлайн-сервіси', NULL, '2025-08-20 20:06:38.939005');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (73, 'body-products', 'option', 'services', 'Послуги', '🤝', 'Консультації, обслуговування, підтримка', NULL, '2025-08-20 20:06:38.939005');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (74, 'body-products', 'option', 'subscriptions', 'Підписки', '🔄', 'Регулярні платежі за доступ', NULL, '2025-08-20 20:06:38.939005');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (75, 'body-products', 'option', 'education', 'Освіта', '📚', 'Курси, тренінги, навчальні матеріали', NULL, '2025-08-20 20:06:38.939005');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (76, 'body-actions', 'option', 'marketing', 'Маркетинг', '📢', 'Просування та реклама бренду', NULL, '2025-08-20 20:06:42.397073');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (77, 'body-actions', 'option', 'product-development', 'Розробка продукту', '🛠️', 'Створення та вдосконалення продуктів', NULL, '2025-08-20 20:06:42.397073');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (78, 'body-actions', 'option', 'customer-service', 'Обслуговування клієнтів', '☎️', 'Підтримка та взаємодія з клієнтами', NULL, '2025-08-20 20:06:42.397073');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (79, 'body-actions', 'option', 'partnerships', 'Партнерства', '🤝', 'Співпраця з іншими компаніями', NULL, '2025-08-20 20:06:42.397073');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (80, 'body-actions', 'option', 'community-building', 'Спільнота', '👥', 'Створення та розвиток спільноти бренду', NULL, '2025-08-20 20:06:42.397073');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (81, 'soul-values', 'option', 'helping', 'Допомога', '🤝', 'Прагнення допомагати іншим', NULL, '2025-08-21 10:04:18.330585');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (82, 'soul-values', 'option', 'reliability', 'Надійність', '🛡️', 'Бути тим, на кого можна покластися', NULL, '2025-08-21 10:04:18.330585');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (83, 'body-products', 'option', 'ecommerce', 'Інтернет-магазин', '🛒', 'Онлайн продаж товарів', NULL, '2025-08-21 15:24:32.402196');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (84, 'body-products', 'option', 'saas', 'SaaS продукти', '☁️', 'Програмне забезпечення як послуга', NULL, '2025-08-21 15:24:32.402196');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (85, 'body-products', 'option', 'marketplace', 'Маркетплейс', '🏪', 'Платформа для покупців та продавців', NULL, '2025-08-21 15:24:32.402196');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (86, 'body-products', 'option', 'consulting', 'Консалтинг', '🎯', 'Експертні поради та стратегії', NULL, '2025-08-21 15:24:32.402196');
INSERT INTO public.card_properties (id, card_id, type, key, label, icon, description, value, created_at) VALUES (87, 'body-products', 'option', 'manufacturing', 'Виробництво', '🏭', 'Створення фізичних товарів', NULL, '2025-08-21 15:24:32.402196');


--
-- Data for Name: card_relations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.card_relations (id, from_card_id, to_card_id, relation_type, condition, label, created_at) VALUES (1, 'soul-start', 'soul-values', 'next', NULL, 'Визначити цінності', '2025-08-18 18:57:52.392599');
INSERT INTO public.card_relations (id, from_card_id, to_card_id, relation_type, condition, label, created_at) VALUES (2, 'soul-values', 'soul-mission', 'next', NULL, 'Створити місію', '2025-08-18 18:57:52.392599');
INSERT INTO public.card_relations (id, from_card_id, to_card_id, relation_type, condition, label, created_at) VALUES (3, 'soul-mission', 'soul-story', 'next', NULL, 'Розповісти історію', '2025-08-18 18:57:52.392599');
INSERT INTO public.card_relations (id, from_card_id, to_card_id, relation_type, condition, label, created_at) VALUES (4, 'soul-story', 'soul-purpose', 'next', NULL, 'Знайти мету', '2025-08-18 18:57:52.392599');
INSERT INTO public.card_relations (id, from_card_id, to_card_id, relation_type, condition, label, created_at) VALUES (5, 'soul-purpose', 'mind-start', 'unlock', NULL, 'Перейти до стратегії', '2025-08-18 18:57:52.392599');
INSERT INTO public.card_relations (id, from_card_id, to_card_id, relation_type, condition, label, created_at) VALUES (6, 'mind-start', 'mind-audience', 'next', NULL, 'Визначити аудиторію', '2025-08-18 18:57:52.392599');
INSERT INTO public.card_relations (id, from_card_id, to_card_id, relation_type, condition, label, created_at) VALUES (7, 'mind-audience', 'mind-positioning', 'next', NULL, 'Створити позиціонування', '2025-08-18 18:57:52.392599');
INSERT INTO public.card_relations (id, from_card_id, to_card_id, relation_type, condition, label, created_at) VALUES (8, 'mind-positioning', 'mind-archetype', 'next', NULL, 'Обрати архетип', '2025-08-18 18:57:52.392599');
INSERT INTO public.card_relations (id, from_card_id, to_card_id, relation_type, condition, label, created_at) VALUES (9, 'mind-archetype', 'mind-promise', 'next', NULL, 'Сформулювати обіцянку', '2025-08-18 18:57:52.392599');
INSERT INTO public.card_relations (id, from_card_id, to_card_id, relation_type, condition, label, created_at) VALUES (10, 'mind-promise', 'body-start', 'unlock', NULL, 'Перейти до втілення', '2025-08-18 18:57:52.392599');
INSERT INTO public.card_relations (id, from_card_id, to_card_id, relation_type, condition, label, created_at) VALUES (11, 'body-start', 'body-products', 'next', NULL, 'Описати продукти', '2025-08-18 18:57:52.392599');
INSERT INTO public.card_relations (id, from_card_id, to_card_id, relation_type, condition, label, created_at) VALUES (12, 'body-products', 'body-channels', 'next', NULL, 'Обрати канали', '2025-08-18 18:57:52.392599');
INSERT INTO public.card_relations (id, from_card_id, to_card_id, relation_type, condition, label, created_at) VALUES (13, 'body-channels', 'body-visual', 'next', NULL, 'Створити стиль', '2025-08-18 18:57:52.392599');
INSERT INTO public.card_relations (id, from_card_id, to_card_id, relation_type, condition, label, created_at) VALUES (14, 'body-visual', 'body-actions', 'next', NULL, 'Скласти план дій', '2025-08-18 18:57:52.392599');


--
-- Data for Name: card_responses; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (35, '9dcce0e8-121b-4c83-820f-1c7e48281f0f', 'soul-story', '"Ця гра допоможе вам пройти через три рівні розвитку бренду: Душа (цінності), Розум (стратегія) та Тіло (втілення). Кожен рівень розкриває нові аспекти вашого бренду."', 'text', '2025-08-18 20:13:24.794628', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (36, '9dcce0e8-121b-4c83-820f-1c7e48281f0f', 'soul-values', '["creativity","quality","helping","sustainability"]', 'text', '2025-08-18 20:13:37.730218', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (6, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'soul-values', '["reliability","creativity","quality","helping"]', 'text', '2025-08-18 19:33:07.383202', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (7, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'soul-mission', '"вамівмівмівммівмі вмів мів м"', 'text', '2025-08-18 19:33:19.443998', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (32, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'soul-values', '["honesty","innovation","quality","helping","reliability"]', 'text', '2025-08-21 09:40:13.366426', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (2, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'soul-start', '"Тестова відповідь"', 'text', '2025-08-18 19:36:05.267916', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (18, 'bcaaf853-20f5-41e1-95d0-51eace4317f4', 'soul-start', '"ready"', 'text', '2025-08-18 19:39:21.454332', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (19, 'bcaaf853-20f5-41e1-95d0-51eace4317f4', 'soul-values', '["innovation","honesty","creativity","community","freedom"]', 'text', '2025-08-18 19:39:40.199694', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (20, 'bcaaf853-20f5-41e1-95d0-51eace4317f4', 'soul-mission', '"Ця гра допоможе вам пройти через три рівні розвитку бренду: Душа (цінності), Розум (стратегія) та Тіло (втілення). Кожен рівень розкриває нові аспекти вашого бренду."', 'text', '2025-08-18 19:40:14.706167', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (21, 'bcaaf853-20f5-41e1-95d0-51eace4317f4', 'soul-story', '"Ця гра допоможе вам пройти через три рівні розвитку бренду: Душа (цінності), Розум (стратегія) та Тіло (втілення). Кожен рівень розкриває нові аспекти вашого бренду."', 'text', '2025-08-18 19:40:16.47369', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (22, 'bcaaf853-20f5-41e1-95d0-51eace4317f4', 'soul-purpose', '"Ця гра допоможе вам пройти через три рівні розвитку бренду: Душа (цінності), Розум (стратегія) та Тіло (втілення). Кожен рівень розкриває нові аспекти вашого бренду."', 'text', '2025-08-18 19:40:17.3', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (23, 'bcaaf853-20f5-41e1-95d0-51eace4317f4', 'soul-emotion', '"empowerment"', 'text', '2025-08-18 19:40:19.537559', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (28, 'bcaaf853-20f5-41e1-95d0-51eace4317f4', 'mind-start', '"ready-strategy"', 'text', '2025-08-18 19:40:49.464682', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (34, '9dcce0e8-121b-4c83-820f-1c7e48281f0f', 'soul-mission', '"Ця гра допоможе вам пройти через три рівні розвитку бренду: Душа (цінності), Розум (стратегія) та Тіло (втілення). Кожен рівень розкриває нові аспекти вашого бренду."', 'text', '2025-08-18 20:12:27.779776', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (37, '9dcce0e8-121b-4c83-820f-1c7e48281f0f', 'soul-impact', '"Тестова відповідь про вплив"', 'text', '2025-08-18 20:15:16.158317', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (38, '8fc89013-041a-48e4-9671-3856f0f19978', 'soul-values', '["sustainability","quality","creativity","honesty","community"]', 'text', '2025-08-18 20:16:57.196874', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (39, '8fc89013-041a-48e4-9671-3856f0f19978', 'soul-mission', '"Сформулюйте місію вашого бренду в одному реченні\n\nСформулюйте місію вашого бренду в одному реченні"', 'text', '2025-08-18 20:17:03.577367', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (40, '8fc89013-041a-48e4-9671-3856f0f19978', 'soul-story', '"Сформулюйте місію вашого бренду в одному реченні\n\nСформулюйте місію вашого бренду в одному реченні\n\nСформулюйте місію вашого бренду в одному реченні"', 'text', '2025-08-18 20:17:08.386505', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (41, '8fc89013-041a-48e4-9671-3856f0f19978', 'soul-purpose', '"Сформулюйте місію вашого бренду в одному реченні\n\nСформулюйте місію вашого бренду в одному реченні\n\nСформулюйте місію вашого бренду в одному реченні"', 'text', '2025-08-18 20:17:11.510218', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (42, '8fc89013-041a-48e4-9671-3856f0f19978', 'soul-emotion', '"excitement"', 'text', '2025-08-18 20:17:13.940675', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (43, '8fc89013-041a-48e4-9671-3856f0f19978', 'soul-archetype', '["magician"]', 'text', '2025-08-18 20:17:23.814835', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (44, '8fc89013-041a-48e4-9671-3856f0f19978', 'soul-impact', '"Сформулюйте місію вашого бренду в одному реченні"', 'text', '2025-08-18 20:17:35.57694', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (45, 'cb43dd7f-507f-4487-b407-cc0a8703b882', 'soul-values', '["innovation","creativity","reliability","excellence","sustainability"]', 'text', '2025-08-18 20:25:00.569658', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (46, 'cb43dd7f-507f-4487-b407-cc0a8703b882', 'soul-start', '"Ознайомлений з правилами"', 'text', '2025-08-18 20:26:46.60287', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (47, '4a759e72-8ff1-4ac6-9713-4d95780a8c4e', 'soul-values', '["creativity","honesty","freedom","reliability"]', 'text', '2025-08-18 20:30:27.037288', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (49, '4a759e72-8ff1-4ac6-9713-4d95780a8c4e', 'soul-mission', '"💡 Заради чого існує ваш бренд? Яку вищу мету він переслідує?"', 'text', '2025-08-18 20:30:38.691479', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (50, 'fd45e094-f376-483b-a003-10ba154bca86', 'soul-mission', '"💡 Заради чого існує ваш бренд? Яку вищу мету він переслідує?"', 'text', '2025-08-18 20:31:29.165606', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (52, 'bcaaf853-20f5-41e1-95d0-51eace4317f4', 'soul-archetype', '["explorer"]', 'text', '2025-08-18 20:43:34.370172', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (53, 'bcaaf853-20f5-41e1-95d0-51eace4317f4', 'soul-impact', '"Розкажіть, як обрані цінності проявляються у вашій щоденній роботі\n\nРозкажіть, як обрані цінності проявляються у вашій щоденній роботі\n\nРозкажіть, як обрані цінності проявляються у вашій щоденній роботі"', 'text', '2025-08-18 20:43:55.480606', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (55, 'd00c1880-c3e8-4afc-a713-e85ba3a7a7c0', 'soul-values', '["innovation","quality","honesty"]', 'choice', '2025-08-18 20:48:19.809134', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (31, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'soul-mission', '"Сформулюйте місію вашого бренду в одному реченні\n\nСформулюйте місію вашого бренду в одному реченні"', 'text', '2025-08-21 09:40:22.101066', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (33, 'b8d8120a-6aa0-4d4e-96ec-089588060173', 'soul-start', '"completed"', 'text', '2025-09-04 12:07:03.27643', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (58, '10092937-594c-4c71-8764-f0b35e348275', 'soul-values', '["innovation","quality","honesty"]', 'choice', '2025-08-18 20:49:07.221744', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (83, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'soul-impact', '"Як ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?"', 'text', '2025-08-19 10:36:14.063729', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (8, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'soul-story', '"вамівмівмівммівмі вмів мів м Як ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?"', 'text', '2025-08-19 10:36:22.140024', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (9, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'soul-purpose', '"вамівмівмівммівмі вмів мів мЯк ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?"', 'text', '2025-08-19 10:36:30.789777', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (86, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'soul-emotion', '"trust"', 'text', '2025-08-19 10:36:34.425144', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (87, 'bcaaf853-20f5-41e1-95d0-51eace4317f4', 'soul-deep-values', '"/game/cf7cf345-d204-44bd-b11a-c9687e14688d?card=soul-archetype/game/cf7cf345-d204-44bd-b11a-c9687e14688d?card=soul-archetype"', 'text', '2025-08-19 10:37:31.154439', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (88, 'bcaaf853-20f5-41e1-95d0-51eace4317f4', 'mind-audience', '"Створіть детальний портрет вашого ідеального клієнтаСтворіть детальний портрет вашого ідеального клієнтаСтворіть детальний портрет вашого ідеального клієнтаСтворіть детальний портрет вашого ідеального клієнта"', 'text', '2025-08-19 10:37:54.886094', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (89, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'soul-deep-values', '"Розкажіть, як обрані цінності проявляються у вашій щоденній роботі\n\nРозкажіть, як обрані цінності проявляються у вашій щоденній роботі"', 'text', '2025-08-19 10:48:33.200909', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (92, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'soul-archetype', '"sage"', 'text', '2025-08-20 19:51:21.148988', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (93, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'mind-audience', '"Молоді професіонали 25-35 років"', 'text', '2025-08-20 19:51:30.238109', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (95, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'mind-target', '"IT спеціалісти"', 'text', '2025-08-20 19:51:32.160734', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (96, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'body-channels', '"online"', 'text', '2025-08-20 19:51:43.311247', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (97, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'body-metrics', '["retention","customers","profit","revenue","satisfaction"]', 'text', '2025-08-20 20:47:53.989601', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (98, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'mind-problem', '"Яку головну проблему вашої цільової аудиторії ви вирішуєте?"', 'text', '2025-08-20 20:04:33.653016', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (99, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'mind-solution', '"Як саме ваш бренд вирішує цю проблему?\n\nЯк саме ваш бренд вирішує цю проблему?"', 'text', '2025-08-20 20:04:57.897111', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (100, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'mind-archetype', '"hero"', 'text', '2025-08-20 20:06:10.441856', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (101, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'body-tone', '"friendly"', 'text', '2025-08-20 20:06:28.246216', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (102, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'body-products', '["digital","services"]', 'array', '2025-08-20 20:06:44.944094', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (103, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'body-actions', '["marketing","product-development"]', 'array', '2025-08-20 20:06:45.839228', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (104, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'mind-positioning', '"innovative"', 'text', '2025-08-20 20:13:06.415145', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (105, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'mind-promise', '"Яку конкретну обіцянку ви даєте клієнтам?\n\nЯку конкретну обіцянку ви даєте клієнтам?\n\nЯку конкретну обіцянку ви даєте клієнтам?"', 'text', '2025-08-20 20:13:11.426219', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (106, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'mind-start', '"start"', 'text', '2025-08-20 20:14:51.238221', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (107, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'body-visual', '"Опишіть візуальний стиль вашого бренду\n\nОпишіть візуальний стиль вашого бренду"', 'text', '2025-08-20 20:47:45.073862', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (94, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'body-pricing', '"penetration"', 'text', '2025-08-20 20:47:49.118579', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (110, 'cf7cf345-d204-44bd-b11a-c9687e14688d', 'body-launch', '"Опишіть перші кроки для запуску вашого бренду\n\nОпишіть перші кроки для запуску вашого брендуОпишіть перші кроки для запуску вашого бренду"', 'text', '2025-08-20 20:48:03.285415', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (111, '2e02d270-c689-4535-816f-ac561f974749', 'soul-values', '["innovation","honesty","creativity","helping"]', 'text', '2025-08-20 21:02:45.412647', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (112, '2e02d270-c689-4535-816f-ac561f974749', 'soul-deep-values', '"Розкажіть, як обрані цінності проявляються у вашій щоденній роботі Розкажіть, як обрані цінності проявляються у вашій щоденній роботі"', 'text', '2025-08-20 21:03:03.359706', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (113, '2e02d270-c689-4535-816f-ac561f974749', 'soul-mission', '"Розкажіть, як обрані цінності проявляються у вашій щоденній роботі Розкажіть, як обрані цінності проявляються у вашій щоденній роботі"', 'text', '2025-08-20 21:03:21.141121', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (114, '2e02d270-c689-4535-816f-ac561f974749', 'soul-impact', '"Розкажіть, як обрані цінності проявляються у вашій щоденній роботі Розкажіть, як обрані цінності проявляються у вашій щоденній роботі"', 'text', '2025-08-20 21:03:26.520506', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (115, '2e02d270-c689-4535-816f-ac561f974749', 'soul-story', '"Розкажіть, як обрані цінності проявляються у вашій щоденній роботі Розкажіть, як обрані цінності проявляються у вашій щоденній роботі"', 'text', '2025-08-20 21:03:31.630195', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (116, '2e02d270-c689-4535-816f-ac561f974749', 'soul-purpose', '"Розкажіть, як обрані цінності проявляються у вашій щоденній роботі Розкажіть, як обрані цінності проявляються у вашій щоденній роботі"', 'text', '2025-08-20 21:03:40.018319', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (117, '2e02d270-c689-4535-816f-ac561f974749', 'soul-emotion', '"trust"', 'text', '2025-08-20 21:03:47.437617', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (119, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'soul-deep-values', '"Розкажіть, як обрані цінності проявляються у вашій щоденній роботі\n\nРозкажіть, як обрані цінності проявляються у вашій щоденній роботі"', 'text', '2025-08-21 09:40:18.422333', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (123, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'soul-impact', '"Як ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?"', 'text', '2025-08-21 09:40:29.483101', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (125, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'soul-purpose', '"Яка глибинна потреба людей рухає вашим брендом?\n\nЯка глибинна потреба людей рухає вашим брендом?\n\nЯка глибинна потреба людей рухає вашим брендом?"', 'text', '2025-08-21 09:40:36.423891', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (118, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'soul-emotion', '"inspiration"', 'text', '2025-08-21 09:40:39.02235', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (128, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'soul-archetype', '["lover","magician","everyman"]', 'text', '2025-08-21 09:56:01.527702', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (124, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'soul-story', '"Розкажіть унікальну історію вашого бренду. Що вас надихнуло створити цей бренд?\nРозкажіть унікальну історію вашого бренду. Що вас надихнуло створити цей бренд?"', 'text', '2025-08-21 09:56:31.09367', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (133, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'soul-start', '"completed"', 'text', '2025-08-21 10:28:24.325208', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (134, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'mind-start', '"completed"', 'text', '2025-08-21 10:29:37.046878', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (135, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'mind-audience', '"Опишіть детально вашу ідеальну цільову аудиторіюОпишіть детально вашу ідеальну цільову аудиторіюОпишіть детально вашу ідеальну цільову аудиторіюОпишіть детально вашу ідеальну цільову аудиторію"', 'text', '2025-08-21 10:29:57.347554', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (136, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'mind-problem', '"Яку головну проблему вашої цільової аудиторії ви вирішуєте?\n\nЯку головну проблему вашої цільової аудиторії ви вирішуєте?\n\nЯку головну проблему вашої цільової аудиторії ви вирішуєте?"', 'text', '2025-08-21 10:30:01.750277', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (173, 'b8d8120a-6aa0-4d4e-96ec-089588060173', 'mind-start', '"completed"', 'text', '2025-08-23 08:14:32.967905', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (174, 'b8d8120a-6aa0-4d4e-96ec-089588060173', 'mind-audience', '"dsakfsdkfjsdkfsdfds fs fdsv sdsv sdvsdvsds vsd vsd vsdv sdv sd vgsdvsd vd vsd vsd vsdvsv sdv sdv sd vsd s"', 'text', '2025-08-23 09:02:59.594005', '2025-08-23 09:02:59.594005', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (175, 'b8d8120a-6aa0-4d4e-96ec-089588060173', 'mind-problem', '"sdvsdv s dvsd vsd vs vd vs"', 'text', '2025-08-23 09:03:05.318965', '2025-08-23 09:03:05.318965', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (176, 'b8d8120a-6aa0-4d4e-96ec-089588060173', 'mind-solution', '"ывмсыв мыв мы"', 'text', '2025-08-23 09:04:51.17156', '2025-08-23 09:04:51.17156', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (177, 'b8d8120a-6aa0-4d4e-96ec-089588060173', 'mind-archetype', '["innocent","explorer","rebel"]', 'text', '2025-08-23 09:05:00.165027', '2025-08-23 09:05:00.165027', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (137, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'mind-solution', '"Як саме ваш бренд вирішує цю проблему? Опишіть ваше унікальне рішення.\n\nЯк саме ваш бренд вирішує цю проблему? Опишіть ваше унікальне рішення.\n\nЯк саме ваш бренд вирішує цю проблему? Опишіть ваше унікальне рішення."', 'text', '2025-08-21 10:30:06.119538', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (138, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'mind-archetype', '["lover","rebel","explorer"]', 'text', '2025-08-21 14:31:04.353872', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (139, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'mind-positioning', '"Як ви позиціонуєте свій бренд на ринку? Чим відрізняєтеся?\n\nЯк ви позиціонуєте свій бренд на ринку? Чим відрізняєтеся?"', 'text', '2025-08-21 14:31:08.241883', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (140, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'mind-promise', '"Як ви позиціонуєте свій бренд на ринку? Чим відрізняєтеся?"', 'text', '2025-08-21 14:31:13.62388', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (141, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'body-start', '"completed"', 'text', '2025-08-21 14:31:31.936446', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (142, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'body-products', '["digital","services","subscriptions","education","saas"]', 'text', '2025-08-21 16:34:29.562342', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (144, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'body-channels', '["events","advertising","email","social-media","partnerships","direct-sales"]', 'text', '2025-08-21 17:06:22.202758', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (145, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'body-tone', '["casual","professional"]', 'text', '2025-08-21 17:22:12.50475', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (146, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'body-visual', '"Опишіть візуальний стиль вашого бренду - кольори, форми, настрій\n\nОпишіть візуальний стиль вашого бренду - кольори, форми, настрій"', 'text', '2025-08-21 17:22:18.224919', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (147, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'body-pricing', '58', 'text', '2025-08-21 17:22:40.550539', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (148, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'body-metrics', '["revenue","customers","engagement"]', 'text', '2025-08-21 17:22:47.420975', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (149, 'e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'body-launch', '"Опишіть план запуску вашого бренду\nОпишіть план запуску вашого бренду"', 'text', '2025-08-21 17:23:08.313477', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (154, '1d588f57-057e-4767-92b7-29ac75c57bfd', 'soul-start', '"completed"', 'text', '2025-08-22 18:30:15.283457', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (155, '1d588f57-057e-4767-92b7-29ac75c57bfd', 'soul-values', '["honesty","quality","innovation","respect","teamwork"]', 'text', '2025-08-22 18:30:21.306817', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (156, '1d588f57-057e-4767-92b7-29ac75c57bfd', 'soul-deep-values', '"Розкажіть, як обрані цінності проявляються у вашій щоденній роботі"', 'text', '2025-08-22 18:30:25.061651', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (157, '1d588f57-057e-4767-92b7-29ac75c57bfd', 'soul-mission', '"Опишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?"', 'text', '2025-08-22 18:30:31.513226', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (158, '1d588f57-057e-4767-92b7-29ac75c57bfd', 'soul-impact', '"Опишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?\n\nОпишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?"', 'text', '2025-08-22 18:30:34.176892', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (159, '1d588f57-057e-4767-92b7-29ac75c57bfd', 'soul-story', '"Опишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?\n\nОпишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?"', 'text', '2025-08-22 18:30:36.558946', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (160, '1d588f57-057e-4767-92b7-29ac75c57bfd', 'soul-purpose', '"Опишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?\n\nОпишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?\n\nОпишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?"', 'text', '2025-08-22 18:30:38.900586', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (161, '1d588f57-057e-4767-92b7-29ac75c57bfd', 'soul-emotion', '"Опишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?"', 'text', '2025-08-22 18:30:41.097045', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (162, '1d588f57-057e-4767-92b7-29ac75c57bfd', 'soul-archetype', '["rebel"]', 'values', '2025-08-22 18:32:47.741828', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (163, '1d588f57-057e-4767-92b7-29ac75c57bfd', 'mind-start', '"ready-strategy"', 'text', '2025-08-22 18:33:02.309487', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (169, '0e84f257-e910-4a33-ba8e-5ad91ccf6d5f', 'soul-start', '"completed"', 'text', '2025-08-22 20:32:05.67256', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (170, '0e84f257-e910-4a33-ba8e-5ad91ccf6d5f', 'soul-values', '["honesty","quality","respect","teamwork","customer-first"]', 'text', '2025-08-22 20:32:13.712138', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (171, '0e84f257-e910-4a33-ba8e-5ad91ccf6d5f', 'soul-deep-values', '"Jjjijhhi"', 'text', '2025-08-22 20:32:19.606383', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (172, '0e84f257-e910-4a33-ba8e-5ad91ccf6d5f', 'soul-mission', '"Huuuiijjjijjiiijjkkjjuujuuhhtttttggt t yhhuhhtyhghhh"', 'text', '2025-08-22 20:32:30.352753', '2025-08-23 09:01:47.459413', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (151, 'b8d8120a-6aa0-4d4e-96ec-089588060173', 'soul-values', '["honesty","quality","innovation","respect","sustainability"]', 'text', '2025-09-04 12:07:15.795627', '2025-08-23 09:01:47.459413', 19, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (152, 'b8d8120a-6aa0-4d4e-96ec-089588060173', 'soul-deep-values', '"Розкажіть, як обрані цінності проявляються у вашій щоденній роботі\n\nРозкажіть, як обрані цінності проявляються у вашій щоденній роботі"', 'text', '2025-09-04 12:07:27.071992', '2025-08-23 09:01:47.459413', 30, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (164, 'b8d8120a-6aa0-4d4e-96ec-089588060173', 'soul-mission', '"Опишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?\n\nОпишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?"', 'text', '2025-09-04 12:07:33.724781', '2025-08-23 09:01:47.459413', 37, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (165, 'b8d8120a-6aa0-4d4e-96ec-089588060173', 'soul-impact', '"Опишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?\n\nОпишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?"', 'text', '2025-09-04 12:07:36.867033', '2025-08-23 09:01:47.459413', 40, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (166, 'b8d8120a-6aa0-4d4e-96ec-089588060173', 'soul-story', '"Опишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?\n\nОпишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?\n\nОпишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?"', 'text', '2025-09-04 12:07:38.235931', '2025-08-23 09:01:47.459413', 41, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (168, 'b8d8120a-6aa0-4d4e-96ec-089588060173', 'soul-emotion', '"Опишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?\n\nОпишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?"', 'text', '2025-09-04 12:07:43.880272', '2025-08-23 09:01:47.459413', 47, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (178, 'b8d8120a-6aa0-4d4e-96ec-089588060173', 'mind-positioning', '"Як ви позиціонуєте свій бренд на ринку? Чим відрізняєтеся?\n\nЯк ви позиціонуєте свій бренд на ринку? Чим відрізняєтеся?"', 'text', '2025-08-23 09:06:47.058863', '2025-08-23 09:06:47.058863', 15, true, 100);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (153, 'b8d8120a-6aa0-4d4e-96ec-089588060173', 'soul-archetype', '["rebel","magician","everyman"]', 'text', '2025-08-23 09:15:32.591367', '2025-08-23 09:01:47.459413', 6, true, 15);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (182, 'a56a6bdb-67c0-48b9-a9ab-0861045618a1', 'soul-start', '"completed"', 'text', '2025-08-23 09:23:43.215508', '2025-08-23 09:23:43.215508', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (183, 'a56a6bdb-67c0-48b9-a9ab-0861045618a1', 'soul-values', '["sustainability","teamwork","growth"]', 'text', '2025-08-23 09:23:46.726485', '2025-08-23 09:23:46.726485', 5, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (184, '2e02d270-c689-4535-816f-ac561f974749', 'soul-start', '"completed"', 'text', '2025-08-23 11:43:00.273478', '2025-08-23 11:43:00.273478', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (185, '2e02d270-c689-4535-816f-ac561f974749', 'soul-archetype', '["magician","rebel","hero"]', 'text', '2025-08-23 11:43:07.261705', '2025-08-23 11:43:07.261705', 3, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (186, '2e02d270-c689-4535-816f-ac561f974749', 'mind-start', '"completed"', 'text', '2025-08-23 11:43:19.070961', '2025-08-23 11:43:19.070961', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (187, '2e02d270-c689-4535-816f-ac561f974749', 'mind-audience', '"Опишіть детально вашу ідеальну цільову аудиторіюОпишіть детально вашу ідеальну цільову аудиторіюОпишіть детально вашу ідеальну цільову аудиторію"', 'text', '2025-08-23 11:43:31.740675', '2025-08-23 11:43:31.740675', 8, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (188, '2e02d270-c689-4535-816f-ac561f974749', 'mind-problem', '"Яку головну проблему вашої цільової аудиторії ви вирішуєте?\n\nЯку головну проблему вашої цільової аудиторії ви вирішуєте?"', 'text', '2025-08-23 11:43:37.065283', '2025-08-23 11:43:37.065283', 14, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (189, '2e02d270-c689-4535-816f-ac561f974749', 'mind-solution', '"Яку головну проблему вашої цільової аудиторії ви вирішуєте?\n\nЯку головну проблему вашої цільової аудиторії ви вирішуєте?\n\nЯку головну проблему вашої цільової аудиторії ви вирішуєте?"', 'text', '2025-08-23 11:43:39.58962', '2025-08-23 11:43:39.58962', 16, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (190, '2e02d270-c689-4535-816f-ac561f974749', 'mind-archetype', '["sage","innocent","explorer"]', 'text', '2025-08-23 11:44:22.412849', '2025-08-23 11:44:22.412849', 25, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (191, '2e02d270-c689-4535-816f-ac561f974749', 'mind-positioning', '"Як ви позиціонуєте свій бренд на ринку? Чим відрізняєтеся?\n\nЯк ви позиціонуєте свій бренд на ринку? Чим відрізняєтеся?"', 'text', '2025-08-23 11:44:26.788264', '2025-08-23 11:44:26.788264', 29, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (192, '2e02d270-c689-4535-816f-ac561f974749', 'mind-promise', '"Як ви позиціонуєте свій бренд на ринку? Чим відрізняєтеся?\n\nЯк ви позиціонуєте свій бренд на ринку? Чим відрізняєтеся?"', 'text', '2025-08-23 11:44:29.192837', '2025-08-23 11:44:29.192837', 31, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (193, '2e02d270-c689-4535-816f-ac561f974749', 'body-start', '"completed"', 'text', '2025-08-23 11:44:34.333601', '2025-08-23 11:44:34.333601', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (194, '2e02d270-c689-4535-816f-ac561f974749', 'body-products', '["services","subscriptions","education"]', 'text', '2025-08-23 11:45:33.285856', '2025-08-23 11:45:33.285856', 24, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (195, '2e02d270-c689-4535-816f-ac561f974749', 'body-channels', '["email","advertising","events"]', 'text', '2025-08-23 11:45:53.645663', '2025-08-23 11:45:53.645663', 44, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (196, '2e02d270-c689-4535-816f-ac561f974749', 'body-tone', '["casual","authoritative"]', 'text', '2025-08-23 11:46:13.574791', '2025-08-23 11:46:13.574791', 64, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (197, '2e02d270-c689-4535-816f-ac561f974749', 'body-visual', '"Опишіть візуальний стиль вашого бренду - кольори, форми, настрій\n\nОпишіть візуальний стиль вашого бренду - кольори, форми, настрій\n\nОпишіть візуальний стиль вашого бренду - кольори, форми, настрій"', 'text', '2025-08-23 11:46:18.026148', '2025-08-23 11:46:18.026148', 69, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (198, '2e02d270-c689-4535-816f-ac561f974749', 'body-pricing', '58', 'text', '2025-08-23 11:46:45.892213', '2025-08-23 11:46:45.892213', 96, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (199, '2e02d270-c689-4535-816f-ac561f974749', 'body-metrics', '["conversion","engagement"]', 'text', '2025-08-23 11:47:20.528034', '2025-08-23 11:47:20.528034', 131, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (200, '2e02d270-c689-4535-816f-ac561f974749', 'body-launch', '"Опишіть план запуску вашого бренду\n\nОпишіть план запуску вашого бренду"', 'text', '2025-08-23 11:47:26.367971', '2025-08-23 11:47:26.367971', 137, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (205, '528c7bb2-5b2a-4434-a7a0-a23786144b0a', 'soul-impact', '"Розкажіть, як обрані цінності проявляються у вашій щоденній роботі"', 'text', '2025-08-23 12:16:31.218176', '2025-08-23 12:16:31.218176', 21, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (206, '528c7bb2-5b2a-4434-a7a0-a23786144b0a', 'soul-story', '"Розкажіть, як обрані цінності проявляються у вашій щоденній роботі\n\nРозкажіть, як обрані цінності проявляються у вашій щоденній роботі"', 'text', '2025-08-23 12:16:34.545393', '2025-08-23 12:16:34.545393', 25, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (203, '528c7bb2-5b2a-4434-a7a0-a23786144b0a', 'soul-deep-values', '"Розкажіть, як обрані цінності проявляються у вашій щоденній роботі\n\nРозкажіть, як обрані цінності проявляються у вашій щоденній роботі"', 'text', '2025-08-23 19:34:24.1796', '2025-08-23 12:16:15.453968', 19, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (204, '528c7bb2-5b2a-4434-a7a0-a23786144b0a', 'soul-mission', '"Розкажіть, як обрані цінності проявляються у вашій щоденній роботі\n\nРозкажіть, як обрані цінності проявляються у вашій щоденній роботі"', 'text', '2025-08-23 19:34:35.938301', '2025-08-23 12:16:22.390224', 30, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (167, 'b8d8120a-6aa0-4d4e-96ec-089588060173', 'soul-purpose', '"Опишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?\n\nОпишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?\n\nОпишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?"', 'text', '2025-09-04 12:07:39.603029', '2025-08-23 09:01:47.459413', 43, true, 250);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (202, '528c7bb2-5b2a-4434-a7a0-a23786144b0a', 'soul-values', '["quality","innovation","respect","sustainability"]', 'text', '2025-09-11 09:52:17.721978', '2025-08-23 12:09:33.858309', 4, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (201, '528c7bb2-5b2a-4434-a7a0-a23786144b0a', 'soul-start', '"completed"', 'text', '2025-10-01 11:42:55.419225', '2025-08-23 12:09:28.288508', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (209, '528c7bb2-5b2a-4434-a7a0-a23786144b0a', 'soul-archetype', '["sage","explorer","hero"]', 'text', '2025-08-23 12:16:50.407071', '2025-08-23 12:16:50.407071', 8, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (207, '528c7bb2-5b2a-4434-a7a0-a23786144b0a', 'soul-purpose', '"Розкажіть, як обрані цінності проявляються у вашій щоденній роботі\n\nРозкажіть, як обрані цінності проявляються у вашій щоденній роботі\n\nРозкажіть, як обрані цінності проявляються у вашій щоденній роботі"', 'text', '2025-08-23 12:16:52.735973', '2025-08-23 12:16:37.140202', 10, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (208, '528c7bb2-5b2a-4434-a7a0-a23786144b0a', 'soul-emotion', '"Розкажіть, як обрані цінності проявляються у вашій щоденній роботі\n\nРозкажіть, як обрані цінності проявляються у вашій щоденній роботі\n\nРозкажіть, як обрані цінності проявляються у вашій щоденній роботі"', 'text', '2025-08-23 12:16:56.008086', '2025-08-23 12:16:40.074362', 14, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (215, '528c7bb2-5b2a-4434-a7a0-a23786144b0a', 'mind-start', '"completed"', 'text', '2025-08-23 19:34:56.696651', '2025-08-23 19:34:56.696651', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (216, '528c7bb2-5b2a-4434-a7a0-a23786144b0a', 'mind-audience', '"Опишіть детально вашу ідеальну цільову аудиторіюОпишіть детально вашу ідеальну цільову аудиторіюОпишіть детально вашу ідеальну цільову аудиторію"', 'text', '2025-08-23 19:35:10.236562', '2025-08-23 19:35:10.236562', 9, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (217, '528c7bb2-5b2a-4434-a7a0-a23786144b0a', 'mind-problem', '"Яку головну проблему вашої цільової аудиторії ви вирішуєте?\n\nЯку головну проблему вашої цільової аудиторії ви вирішуєте?\n\nЯку головну проблему вашої цільової аудиторії ви вирішуєте?\n\nЯку головну проблему вашої цільової аудиторії ви вирішуєте?\n\nЯку головну проблему вашої цільової аудиторії ви вирішуєте?"', 'text', '2025-08-23 19:35:23.020466', '2025-08-23 19:35:23.020466', 22, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (218, '528c7bb2-5b2a-4434-a7a0-a23786144b0a', 'mind-solution', '"Яку головну проблему вашої цільової аудиторії ви вирішуєте?\n\nЯку головну проблему вашої цільової аудиторії ви вирішуєте?\n\nЯку головну проблему вашої цільової аудиторії ви вирішуєте?"', 'text', '2025-08-23 19:35:35.038439', '2025-08-23 19:35:35.038439', 34, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (219, '528c7bb2-5b2a-4434-a7a0-a23786144b0a', 'mind-archetype', '["hero","sage","innocent"]', 'text', '2025-08-23 19:35:43.704174', '2025-08-23 19:35:43.704174', 43, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (228, 'b8d8120a-6aa0-4d4e-96ec-089588060173', 'mind-promise', '"Яку головну обіцянку ваш бренд дає клієнтам?\n\nЯку головну обіцянку ваш бренд дає клієнтам?"', 'text', '2025-09-04 12:07:59.835534', '2025-09-04 12:07:59.835534', 5, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (229, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'soul-start', '"completed"', 'text', '2025-09-05 12:47:40.665158', '2025-09-05 12:47:40.665158', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (230, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'soul-values', '["quality","innovation","respect","sustainability","teamwork"]', 'text', '2025-09-05 12:47:50.425125', '2025-09-05 12:47:50.425125', 13, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (231, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'soul-deep-values', '"оруіаг ріва іва івп вар вапр вар. рва рвар в"', 'text', '2025-09-05 12:47:59.318226', '2025-09-05 12:47:59.318226', 22, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (232, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'soul-mission', '"Опишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?\n\nОпишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?"', 'text', '2025-09-05 12:48:05.105943', '2025-09-05 12:48:05.105943', 28, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (233, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'soul-impact', '"Як ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?"', 'text', '2025-09-05 12:48:15.685648', '2025-09-05 12:48:15.685648', 38, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (234, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'soul-story', '"Як ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?"', 'text', '2025-09-05 12:48:20.141067', '2025-09-05 12:48:20.141067', 43, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (235, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'soul-purpose', '"Як ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?"', 'text', '2025-09-05 12:48:24.175497', '2025-09-05 12:48:24.175497', 47, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (236, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'soul-emotion', '"ваиваи Як ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?"', 'text', '2025-09-05 12:48:30.080116', '2025-09-05 12:48:30.080116', 53, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (237, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'soul-archetype', '["magician","rebel","hero"]', 'text', '2025-09-05 12:48:39.283961', '2025-09-05 12:48:39.283961', 4, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (238, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'mind-start', '"completed"', 'text', '2025-09-05 12:49:25.125972', '2025-09-05 12:49:25.125972', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (239, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'mind-audience', '"Як ваш бренд змінює світ на краще?Як ваш бренд змінює світ на краще?Як ваш бренд змінює світ на краще?Як ваш бренд змінює світ на краще?"', 'text', '2025-09-05 12:49:33.005055', '2025-09-05 12:49:33.005055', 3, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (240, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'mind-problem', '"Як ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?"', 'text', '2025-09-05 12:49:35.391219', '2025-09-05 12:49:35.391219', 6, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (241, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'mind-solution', '"Як ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?"', 'text', '2025-09-05 12:49:38.140219', '2025-09-05 12:49:38.140219', 8, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (242, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'mind-archetype', '["sage","innocent","explorer"]', 'text', '2025-09-05 12:49:41.336616', '2025-09-05 12:49:41.336616', 12, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (243, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'mind-positioning', '"Як ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?"', 'text', '2025-09-05 12:49:44.384714', '2025-09-05 12:49:44.384714', 15, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (244, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'mind-promise', '"Як ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?"', 'text', '2025-09-05 12:49:47.665009', '2025-09-05 12:49:47.665009', 18, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (245, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'body-start', '"completed"', 'text', '2025-09-05 12:49:52.568918', '2025-09-05 12:49:52.568918', NULL, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (246, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'body-products', '["subscriptions","services"]', 'text', '2025-09-05 12:50:00.202279', '2025-09-05 12:50:00.202279', 3, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (248, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'body-tone', '["casual"]', 'text', '2025-09-05 12:50:06.077914', '2025-09-05 12:50:06.077914', 9, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (250, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'body-pricing', '57', 'text', '2025-09-05 12:50:17.682012', '2025-09-05 12:50:17.682012', 20, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (247, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'body-channels', '["partnerships","pr"]', 'text', '2025-09-05 12:50:04.300933', '2025-09-05 12:50:04.300933', 7, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (249, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'body-visual', '"Як ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?"', 'text', '2025-09-05 12:50:14.75655', '2025-09-05 12:50:14.75655', 17, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (251, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'body-metrics', '["customers","engagement"]', 'text', '2025-09-05 12:50:19.879075', '2025-09-05 12:50:19.879075', 23, true, 0);
INSERT INTO public.card_responses (id, session_id, card_id, response, response_type, submitted_at, started_at, time_spent, is_within_time_limit, earned_xp) VALUES (252, 'b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'body-launch', '"Як ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?\n\nЯк ваш бренд змінює світ на краще?"', 'text', '2025-09-05 12:50:22.943792', '2025-09-05 12:50:22.943792', 26, true, 0);


--
-- Data for Name: game_cards; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('soul-start', 'soul', 'Початок подорожі', 'Ласкаво просимо до гри "Душа бренду"! Готові розкрити справжню сутність вашого бренду?', 'Початок пригоди', NULL, 'info', 'easy', 2, true, 1, 100, '{}', '{"xp": 50, "unlocks": ["soul-values"]}', '2025-08-18 18:56:08.462098', '2025-08-23 09:47:14.085', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('body-channels', 'body', 'Канали комунікації', 'Через які канали ви будете спілкуватися з аудиторією?', 'Виберіть канали', NULL, 'values', 'medium', 10, true, 7, 700, '{"minSelections": 1}', '{"xp": 150, "unlocks": ["body-visual"]}', '2025-08-18 18:56:31.81019', '2025-09-11 09:53:19.941', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('soul-values', 'soul', 'Цінності бренду', 'Оберіть 3-5 найважливіших цінностей, які визначають ваш бренд', 'Визначте цінності', NULL, 'values', 'medium', 10, true, 2, 150, '{"minSelections": 3, "maxSelections": 5}', '{"xp": 100, "unlocks": ["soul-mission"]}', '2025-08-18 18:56:08.462098', '2025-08-23 09:47:14.109', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('mind-positioning', 'mind', 'Позиціонування бренду', 'Як ви позиціонуєте свій бренд на ринку? Чим відрізняєтеся?', 'Створіть позиціонування', NULL, 'text', 'medium', 20, true, 7, 450, '{"minLength": 80}', '{"xp": 175, "unlocks": ["mind-archetype"]}', '2025-08-18 18:56:19.402755', '2025-08-23 09:47:01.986', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('soul-purpose', 'soul', 'Мета бренду', 'Яка глибша мета вашого бренду? Як ви хочете змінити світ?', 'Визначте мету', NULL, 'reflection', 'hard', 25, true, 9, 300, '{"minLength": 80}', '{"xp": 250, "badges": ["soul_complete"], "unlocks": ["mind-start"]}', '2025-08-18 18:56:08.462098', '2025-08-23 09:47:01.801', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('soul-mission', 'soul', 'Місія бренду', 'Опишіть місію вашого бренду в 1-2 реченнях. Для чого існує ваш бренд?', 'Створіть місію', NULL, 'text', 'medium', 15, true, 5, 200, '{"minLength": 50, "maxLength": 200}', '{"xp": 150, "unlocks": ["soul-story"]}', '2025-08-18 18:56:08.462098', '2025-08-23 09:47:01.706', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('body-visual', 'body', 'Візуальний стиль', 'Опишіть візуальний стиль вашого бренду - кольори, форми, настрій', 'Створіть стиль', NULL, 'text', 'hard', 20, true, 8, 750, '{"minLength": 80}', '{"xp": 175, "unlocks": ["body-actions"]}', '2025-08-18 18:56:31.81019', '2025-09-11 09:53:19.965', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('soul-impact', 'soul', 'Вплив на Світ', 'Як ваш бренд змінює світ на краще?', 'Позитивний вплив бренду', 'Подумайте про конкретні зміни, які ваш бренд приносить у світ', 'text', 'medium', 3, true, 6, 200, NULL, '{"xp": 15}', '2025-08-18 20:14:42.059193', '2025-08-23 09:47:01.729', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('body-actions', 'body', 'План дій', 'Які конкретні дії ви плануєте реалізувати найближчим часом?', 'Складіть план', NULL, 'values', 'hard', 30, true, 9, 800, '{"minSelections": 3, "maxSelections": 8}', '{"xp": 300, "badges": ["body_complete", "brand_master"]}', '2025-08-18 18:56:31.81019', '2025-09-11 09:53:19.989', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('mind-target', 'mind', 'Цільова Аудиторія', 'Опишіть вашу ідеальну цільову аудиторію: хто ці люди, що їх цікавить, які у них потреби?', 'Опишіть цільову аудиторію', 'Подумайте про демографію, психографію та потреби', 'text', 'medium', 3, true, 2, 100, NULL, '{"xp": 15}', '2025-08-18 20:20:52.410779', '2025-08-23 09:47:01.872', '{"minLength": 50, "maxLength": 300}');
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('mind-archetype', 'mind', 'Архетип бренду', 'Оберіть архетип, який найкраще описує характер вашого бренду', 'Оберіть архетип', NULL, 'archetype', 'medium', 10, true, 8, 500, '{"minSelections": 1, "maxSelections": 3}', '{"xp": 150, "unlocks": ["mind-promise"]}', '2025-08-18 18:56:19.402755', '2025-08-23 09:47:02.009', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('soul-emotion', 'soul', 'Емоційна глибина', 'Яка глибинна потреба людей рухає вашим брендом?', 'Емоційний звязок', 'Подумайте про глибинні емоції', 'text', 'medium', 3, true, 2, 3, '{"minLength": 50}', '{"xp": 15}', '2025-08-18 19:34:53.349419', '2025-08-23 09:47:01.639', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('soul-story', 'soul', 'Історія бренду', 'Розкажіть унікальну історію вашого бренду. Що вас надихнуло створити цей бренд?', 'Розкажіть історію', NULL, 'text', 'hard', 20, true, 7, 250, '{"minLength": 100, "maxLength": 500}', '{"xp": 200, "unlocks": ["soul-purpose"]}', '2025-08-18 18:56:08.462098', '2025-08-23 09:47:01.757', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('mind-audience', 'mind', 'Цільова аудиторія', 'Опишіть детально вашу ідеальну цільову аудиторію', 'Визначте аудиторію', NULL, 'text', 'medium', 15, true, 5, 400, '{"minLength": 100}', '{"xp": 125, "unlocks": ["mind-positioning"]}', '2025-08-18 18:56:19.402755', '2025-08-23 09:47:01.941', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('mind-promise', 'mind', 'Обіцянка бренду', 'Яку головну обіцянку ваш бренд дає клієнтам?', 'Сформулюйте обіцянку', NULL, 'text', 'hard', 25, true, 9, 550, '{"minLength": 50, "maxLength": 150}', '{"xp": 200, "badges": ["mind_complete"], "unlocks": ["body-start"]}', '2025-08-18 18:56:19.402755', '2025-08-23 09:47:02.032', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('body-start', 'body', 'Втілення бренду', 'Час втілити ваш бренд у реальність через продукти та канали', 'Почнімо втілення', NULL, 'text', 'easy', 5, true, 5, 600, '{"minLength": 20}', '{"xp": 75, "unlocks": ["body-products"]}', '2025-08-18 18:56:31.81019', '2025-09-11 09:53:19.895', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('body-products', 'body', 'Продукти та послуги', 'Перерахуйте основні продукти чи послуги вашого бренду', 'Опишіть продукти', NULL, 'values', 'medium', 15, true, 6, 650, '{"minSelections": 1, "maxSelections": 10}', '{"xp": 125, "unlocks": ["body-channels"]}', '2025-08-18 18:56:31.81019', '2025-09-11 09:53:19.919', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('mind-problem', 'mind', 'Проблема Аудиторії', 'Яку головну проблему вашої цільової аудиторії ви вирішуєте?', 'Проблема аудиторії', NULL, 'reflection', 'medium', 3, true, 1, 150, NULL, '{"xp": 15}', '2025-08-19 08:26:06.996982', '2025-08-23 09:47:01.847', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('mind-start', 'mind', 'Розум Бренду', 'Вітаємо на рівні "Розум Бренду"! Тут ви розробите стратегію та позиціонування вашого бренду. Визначите цільову аудиторію, конкурентів та унікальну цінність пропозицію.', 'Почнімо стратегію', NULL, 'info', 'easy', 5, true, 3, 350, '{"minLength": 20}', '{"xp": 75, "unlocks": ["mind-audience"]}', '2025-08-18 18:56:19.402755', '2025-08-23 09:47:01.896', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('body-pricing', 'body', 'Ціноутворення', 'Визначте стратегію ціноутворення для вашого бренду', 'Ціноутворення', NULL, 'choice', 'medium', 2, true, 1, 6, '{"minSelections": 1, "maxSelections": 1}', '{"xp": 10}', '2025-08-19 08:59:04.803392', '2025-09-11 09:53:19.8', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('body-tone', 'body', 'Тон голосу', 'Оберіть тон голосу для комунікації вашого бренду', 'Тон голосу', NULL, 'values', 'medium', 4, true, 2, 7, '{"minSelections": 1, "maxSelections": 2}', '{"xp": 20}', '2025-08-19 08:59:04.803392', '2025-09-11 09:53:19.824', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('body-metrics', 'body', 'Метрики успіху', 'Оберіть ключові метрики для вимірювання успіху бренду', 'Метрики успіху', NULL, 'values', 'medium', 4, true, 3, 8, '{"minSelections": 2, "maxSelections": 5}', '{"xp": 20}', '2025-08-19 08:59:04.803392', '2025-09-11 09:53:19.848', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('soul-deep-values', 'soul', 'Глибина Цінностей', 'Розкажіть, як обрані цінності проявляються у вашій щоденній роботі', 'Як живуть цінності', NULL, 'reflection', 'medium', 3, false, 3, 1, NULL, '{"xp": 15}', '2025-08-18 20:47:33.704036', '2025-08-23 09:47:01.661', '{"minLength": 100, "maxLength": 500}');
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('mind-solution', 'mind', 'Рішення Проблеми', 'Як саме ваш бренд вирішує цю проблему? Опишіть ваше унікальне рішення.', 'Рішення проблеми', NULL, 'text', 'medium', 3, true, 4, 200, NULL, '{"xp": 15}', '2025-08-19 08:26:06.996982', '2025-08-23 09:47:01.918', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('mind-benefit', 'mind', 'Основна Вигода', 'Яку головну вигоду отримують клієнти від вашого бренду?', 'Основна вигода', NULL, 'text', 'easy', 3, true, 6, 250, NULL, '{"xp": 15}', '2025-08-19 08:26:06.996982', '2025-08-23 09:47:01.963', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('body-launch', 'body', 'План запуску', 'Опишіть план запуску вашого бренду', 'План запуску', NULL, 'text', 'medium', 3, true, 4, 9, '{"minLength": 50, "maxLength": 1000}', '{"xp": 15}', '2025-08-19 08:59:04.803392', '2025-09-11 09:53:19.871', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('body-complete', 'body', 'Вітаємо! Гра завершена', 'Ви успішно створили повну карту вашого бренду. Тепер ви можете переглянути дошку бренду або почати нову гру.', 'Завершення гри', NULL, 'complete', 'easy', 2, true, 10, 10, '{}', '{"xp": 10}', '2025-08-19 09:05:10.002019', '2025-09-11 09:53:20.012', NULL);
INSERT INTO public.game_cards (id, level_id, title, description, short_description, hint, type, difficulty, estimated_time, required, position_x, position_y, validation, rewards, created_at, updated_at, validation_rules) VALUES ('soul-archetype', 'soul', 'Архетип Бренду', 'Який архетип найкраще описує вашу сутність?', 'Виберіть архетип бренду', 'Архетип визначає характер та поведінку вашого бренду', 'archetype', 'hard', 3, true, 3, 300, '{"maxSelections": 3, "minSelections": 1}', '{"xp": 15}', '2025-08-18 20:14:42.059193', '2025-08-23 09:47:14.132', NULL);


--
-- Data for Name: game_levels; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.game_levels (id, name, description, "order", color, icon, created_at, updated_at) VALUES ('soul', 'Душа бренду', 'Знайдіть свою місію, цінності та історію бренду', 1, '#e11d48', 'Heart', '2025-08-18 18:55:55.984716', '2025-08-18 18:55:55.984716');
INSERT INTO public.game_levels (id, name, description, "order", color, icon, created_at, updated_at) VALUES ('mind', 'Розум бренду', 'Визначте стратегію, позиціонування та аудиторію', 2, '#2563eb', 'Brain', '2025-08-18 18:55:55.984716', '2025-08-18 18:55:55.984716');
INSERT INTO public.game_levels (id, name, description, "order", color, icon, created_at, updated_at) VALUES ('body', 'Тіло бренду', 'Створіть продукти, канали та візуальний стиль', 3, '#16a34a', 'Layers', '2025-08-18 18:55:55.984716', '2025-08-18 18:55:55.984716');


--
-- Data for Name: game_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.game_sessions (id, user_id, current_level, current_card, completed_cards, progress, total_xp, earned_badges, completed, created_at, updated_at, brand_id) VALUES ('10092937-594c-4c71-8764-f0b35e348275', NULL, 'soul', 'soul-start', '["soul-values"]', 5, 0, '[]', NULL, '2025-08-18 18:58:21.741681', '2025-08-18 20:49:07.298165', NULL);
INSERT INTO public.game_sessions (id, user_id, current_level, current_card, completed_cards, progress, total_xp, earned_badges, completed, created_at, updated_at, brand_id) VALUES ('2e02d270-c689-4535-816f-ac561f974749', '427caac4-81c4-4d8e-a2c8-f7e46c49ef88', 'body', 'mind-target', '["soul-values","soul-deep-values","soul-mission","soul-impact","soul-story","soul-purpose","soul-emotion","soul-start","soul-archetype","mind-start","mind-audience","mind-problem","mind-solution","mind-archetype","mind-positioning","mind-promise","body-start","body-products","body-channels","body-tone","body-visual","body-pricing","body-metrics","body-launch"]', 100, 0, '[]', '2025-08-23 11:47:31.127', '2025-08-20 21:01:56.649149', '2025-08-23 11:47:31.127', '59484ea5-8768-4b1f-ab5a-7e4cb137fc50');
INSERT INTO public.game_sessions (id, user_id, current_level, current_card, completed_cards, progress, total_xp, earned_badges, completed, created_at, updated_at, brand_id) VALUES ('d00c1880-c3e8-4afc-a713-e85ba3a7a7c0', 'a46fac7d-2b68-42fe-83ee-0bf3bfb9d0c7', 'soul', '1', '["soul-values"]', 5, 0, '[]', NULL, '2025-08-18 20:48:19.602121', '2025-08-18 20:48:19.887082', '7c204d5e-556e-49ea-bd5d-07490ee15c95');
INSERT INTO public.game_sessions (id, user_id, current_level, current_card, completed_cards, progress, total_xp, earned_badges, completed, created_at, updated_at, brand_id) VALUES ('9dcce0e8-121b-4c83-820f-1c7e48281f0f', 'a46fac7d-2b68-42fe-83ee-0bf3bfb9d0c7', 'soul', 'soul-start', '["soul-story","soul-values","soul-mission","soul-impact"]', 22, 0, '[]', NULL, '2025-08-18 20:11:13.524736', '2025-08-18 20:15:16.235081', '5ef5c74c-b29a-45f0-9ab1-79db8b1041d4');
INSERT INTO public.game_sessions (id, user_id, current_level, current_card, completed_cards, progress, total_xp, earned_badges, completed, created_at, updated_at, brand_id) VALUES ('8fc89013-041a-48e4-9671-3856f0f19978', 'a46fac7d-2b68-42fe-83ee-0bf3bfb9d0c7', 'soul', 'soul-start', '["soul-values","soul-mission","soul-story","soul-purpose","soul-emotion","soul-archetype","soul-impact"]', 39, 0, '[]', NULL, '2025-08-18 20:16:17.630123', '2025-08-18 20:17:35.655481', '5ef5c74c-b29a-45f0-9ab1-79db8b1041d4');
INSERT INTO public.game_sessions (id, user_id, current_level, current_card, completed_cards, progress, total_xp, earned_badges, completed, created_at, updated_at, brand_id) VALUES ('f583ac89-7a89-44c5-94a0-91d08ae1f574', 'a46fac7d-2b68-42fe-83ee-0bf3bfb9d0c7', 'soul', 'soul-start', '[]', 0, 0, '[]', NULL, '2025-08-18 20:22:37.045033', '2025-08-18 20:22:37.045033', '5ef5c74c-b29a-45f0-9ab1-79db8b1041d4');
INSERT INTO public.game_sessions (id, user_id, current_level, current_card, completed_cards, progress, total_xp, earned_badges, completed, created_at, updated_at, brand_id) VALUES ('cb43dd7f-507f-4487-b407-cc0a8703b882', 'a46fac7d-2b68-42fe-83ee-0bf3bfb9d0c7', 'soul', 'soul-start', '["soul-values","soul-start"]', 11, 0, '[]', NULL, '2025-08-18 20:23:47.967282', '2025-08-18 20:26:46.686202', '5ef5c74c-b29a-45f0-9ab1-79db8b1041d4');
INSERT INTO public.game_sessions (id, user_id, current_level, current_card, completed_cards, progress, total_xp, earned_badges, completed, created_at, updated_at, brand_id) VALUES ('0e84f257-e910-4a33-ba8e-5ad91ccf6d5f', 'a46fac7d-2b68-42fe-83ee-0bf3bfb9d0c7', 'soul', 'soul-story', '["soul-start","soul-values","soul-deep-values","soul-mission"]', 14, 0, '[]', NULL, '2025-08-22 20:31:57.116154', '2025-08-22 20:32:30.421099', '46200524-4759-4891-bf3e-f7848de3245e');
INSERT INTO public.game_sessions (id, user_id, current_level, current_card, completed_cards, progress, total_xp, earned_badges, completed, created_at, updated_at, brand_id) VALUES ('4ffd94c9-99a1-455d-a2cc-105402e2110f', 'a46fac7d-2b68-42fe-83ee-0bf3bfb9d0c7', 'soul', '1', '[]', 0, 0, '[]', NULL, '2025-08-18 19:57:50.641709', '2025-08-18 19:57:50.641709', '5ef5c74c-b29a-45f0-9ab1-79db8b1041d4');
INSERT INTO public.game_sessions (id, user_id, current_level, current_card, completed_cards, progress, total_xp, earned_badges, completed, created_at, updated_at, brand_id) VALUES ('4a759e72-8ff1-4ac6-9713-4d95780a8c4e', 'a46fac7d-2b68-42fe-83ee-0bf3bfb9d0c7', 'soul', 'soul-start', '["soul-values","soul-mission"]', 11, 0, '[]', NULL, '2025-08-18 20:27:48.329945', '2025-08-18 20:30:38.766523', '5ef5c74c-b29a-45f0-9ab1-79db8b1041d4');
INSERT INTO public.game_sessions (id, user_id, current_level, current_card, completed_cards, progress, total_xp, earned_badges, completed, created_at, updated_at, brand_id) VALUES ('cf7cf345-d204-44bd-b11a-c9687e14688d', 'a46fac7d-2b68-42fe-83ee-0bf3bfb9d0c7', 'body', 'soul-start', '["soul-values","soul-mission","soul-start","soul-impact","soul-story","soul-purpose","soul-emotion","soul-deep-values","soul-archetype","mind-audience","mind-target","body-channels","body-metrics","mind-problem","mind-solution","mind-archetype","body-tone","body-products","body-actions","mind-positioning","mind-promise","mind-start","body-visual","body-pricing","body-launch"]', 100, 0, '[]', '2025-08-20 20:48:06.309', '2025-08-18 19:30:15.219093', '2025-08-20 20:48:06.309', '5ef5c74c-b29a-45f0-9ab1-79db8b1041d4');
INSERT INTO public.game_sessions (id, user_id, current_level, current_card, completed_cards, progress, total_xp, earned_badges, completed, created_at, updated_at, brand_id) VALUES ('fd45e094-f376-483b-a003-10ba154bca86', 'a46fac7d-2b68-42fe-83ee-0bf3bfb9d0c7', 'soul', 'soul-start', '["soul-mission"]', 5, 0, '[]', NULL, '2025-08-18 20:30:58.851821', '2025-08-18 20:31:29.246425', '5ef5c74c-b29a-45f0-9ab1-79db8b1041d4');
INSERT INTO public.game_sessions (id, user_id, current_level, current_card, completed_cards, progress, total_xp, earned_badges, completed, created_at, updated_at, brand_id) VALUES ('e1f3839f-da4f-4061-a683-bfbc2e6e38c2', 'a46fac7d-2b68-42fe-83ee-0bf3bfb9d0c7', 'body', 'soul-start', '["soul-values","soul-mission","soul-deep-values","soul-impact","soul-purpose","soul-emotion","soul-archetype","soul-story","soul-start","mind-start","mind-audience","mind-problem","mind-solution","mind-archetype","mind-positioning","mind-promise","body-start","body-products","body-channels","body-tone","body-visual","body-pricing","body-metrics","body-launch"]', 100, 0, '[]', '2025-08-21 17:23:14.81', '2025-08-18 19:48:26.831268', '2025-08-21 17:23:14.81', '5ef5c74c-b29a-45f0-9ab1-79db8b1041d4');
INSERT INTO public.game_sessions (id, user_id, current_level, current_card, completed_cards, progress, total_xp, earned_badges, completed, created_at, updated_at, brand_id) VALUES ('1d588f57-057e-4767-92b7-29ac75c57bfd', 'a46fac7d-2b68-42fe-83ee-0bf3bfb9d0c7', 'soul', 'mind-archetype', '["soul-start","soul-values","soul-deep-values","soul-mission","soul-impact","soul-story","soul-purpose","soul-emotion","soul-archetype","mind-start"]', 36, 0, '[]', NULL, '2025-08-22 18:29:59.218501', '2025-08-22 18:33:02.383919', '5ab9013d-aa2c-4fff-adc0-731651feab25');
INSERT INTO public.game_sessions (id, user_id, current_level, current_card, completed_cards, progress, total_xp, earned_badges, completed, created_at, updated_at, brand_id) VALUES ('bcaaf853-20f5-41e1-95d0-51eace4317f4', 'a46fac7d-2b68-42fe-83ee-0bf3bfb9d0c7', 'mind', 'soul-start', '["soul-start","soul-values","soul-mission","soul-story","soul-purpose","soul-emotion","mind-start","soul-archetype","soul-impact","soul-deep-values","mind-audience"]', 100, 0, '[]', '2025-08-21 08:37:05.907', '2025-08-18 19:39:08.731262', '2025-08-21 08:37:05.907', '5ef5c74c-b29a-45f0-9ab1-79db8b1041d4');
INSERT INTO public.game_sessions (id, user_id, current_level, current_card, completed_cards, progress, total_xp, earned_badges, completed, created_at, updated_at, brand_id) VALUES ('a56a6bdb-67c0-48b9-a9ab-0861045618a1', 'a46fac7d-2b68-42fe-83ee-0bf3bfb9d0c7', 'soul', 'soul-deep-values', '["soul-start","soul-values"]', 7, 0, '[]', NULL, '2025-08-22 16:50:49.087471', '2025-08-23 09:23:46.794489', '67e27529-8d5b-4bd8-b61b-1a4b19bb3de7');
INSERT INTO public.game_sessions (id, user_id, current_level, current_card, completed_cards, progress, total_xp, earned_badges, completed, created_at, updated_at, brand_id) VALUES ('528c7bb2-5b2a-4434-a7a0-a23786144b0a', '427caac4-81c4-4d8e-a2c8-f7e46c49ef88', 'mind', 'mind-positioning', '["soul-impact","soul-story","soul-deep-values","soul-mission","soul-values","soul-start","soul-archetype","soul-purpose","soul-emotion","mind-start","mind-audience","mind-problem","mind-solution","mind-archetype"]', 50, 0, '[]', NULL, '2025-08-23 11:47:42.214223', '2025-10-01 11:42:55.498554', '59484ea5-8768-4b1f-ab5a-7e4cb137fc50');
INSERT INTO public.game_sessions (id, user_id, current_level, current_card, completed_cards, progress, total_xp, earned_badges, completed, created_at, updated_at, brand_id) VALUES ('b0851d02-f42f-4a13-b884-e95c0e9e3ed2', 'a46fac7d-2b68-42fe-83ee-0bf3bfb37d14', 'body', 'mind-target', '["soul-start","soul-values","soul-deep-values","soul-mission","soul-impact","soul-story","soul-purpose","soul-emotion","soul-archetype","mind-start","mind-audience","mind-problem","mind-solution","mind-archetype","mind-positioning","mind-promise","body-start","body-products","body-tone","body-pricing","body-channels","body-visual","body-metrics","body-launch"]', 100, 0, '[]', '2025-09-05 12:50:25.282', '2025-09-05 12:47:31.120401', '2025-09-05 12:50:25.282', 'a982ed96-bccb-424c-9531-02d19ad55b0a');
INSERT INTO public.game_sessions (id, user_id, current_level, current_card, completed_cards, progress, total_xp, earned_badges, completed, created_at, updated_at, brand_id) VALUES ('b8d8120a-6aa0-4d4e-96ec-089588060173', 'a46fac7d-2b68-42fe-83ee-0bf3bfb9d0c7', 'mind', 'mind-target', '["soul-start","mind-start","mind-audience","mind-problem","mind-solution","mind-archetype","soul-values","soul-deep-values","soul-mission","soul-impact","soul-story","soul-emotion","mind-positioning","soul-archetype","soul-purpose","mind-promise"]', 57, 365, '[]', NULL, '2025-08-18 19:55:50.920089', '2025-09-04 12:07:59.90602', '5ef5c74c-b29a-45f0-9ab1-79db8b1041d4');


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sessions (sid, sess, expire) VALUES ('9t5Yl7aQ9Bocmrr-hOGEsc7NxQEwMDiS', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:23.068Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:24');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('6zTKQadl4sGGevUBvD5Qr-FmJJNAU4Uy', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:31.909Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:32');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('pTw7svM99RDkDUGgkDgVbClKAp7awpzL', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:31.943Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:32');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('bx1PNktMiNoS-Uotb-r_MHoEo2N2nllJ', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.242Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('EATBKxtWDpzVVHAFCKA24_QoC_kXIAIw', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.269Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('pG7LWsR-N3w8QnuRZ16LWsUEb8l_YVpV', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.295Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('UXXU4eZnKNlPUXX5Gajl2rkceoWk6xCL', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.325Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('wayTFt5SvakrQJaDS_WTxmpjhv07Go6T', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.364Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('19NPzr7Gm2nnfAStXWn5FG5aspQTfIgm', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.773Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('FdRYr8gRk6JbPz8439v_kwaGXBki_n5j', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.810Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('HieS5mWvtY1soTDyDYwdN1gA3mNFZkEE', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.964Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('Cbaoqpr24JRMrHth6aFLYieQ72Tr3mh6', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:33.028Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:34');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('gMvy3LNsHUwfL0lNekpP3yJykv7Y5yIB', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:31.907Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:32');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('AsFPMaAgA7AqPB9tPrEV-uiIu4agrh24', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:31.948Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:32');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('FvKDDIAghbsMPR5igNnMRYZMcdBvEl4w', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.408Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('FFUOHF1KF1djYuDWU7ZLLVi15nAPw-Qk', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.476Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('l9VIWwtn2yD61iHN-GIOqYxBeWF31Ggw', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.503Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('ze3A5OwJCjYSRUBc-XcN66TQBlRRhLjD', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.541Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('zMMmb2M65iBsTM8sD7RdxzdDlZDxwytQ', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.578Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('otA-scpEvgTUs60LfiZ4Wzf5HYChIEWU', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.616Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('U8-_jq1PRr17vL1pJ8qEx9ZXmQiSxHWg', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.641Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('oz1kmbW2XfJBG_GstzTlUXahN4nh3utb', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.665Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('mrcm34Ct7aBNaGVC1BURZWbyqMS3Ngx0', '{"cookie":{"originalMaxAge":2591999999,"expires":"2025-11-03T11:42:32.688Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('zOz6VK1ad4Xc-i3aWvWkC_6E4JgMT1pm', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.713Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('9yN6Ygbml_Pm53dkKs81M-wDi3gyyLV7', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.738Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('-tEop_1IW-xp3ut4_EO0Tx3xpX87LXIh', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.776Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('RXBzfNQChrfPq5hwY13drigEudtW71Pl', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.808Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('tyVCUgGe7VfH5pOpV5xJBIp6-cHDuUq5', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.842Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('QrFhyBle_JrpjGvFm0e77lVm9PasnLGX', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.872Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('5zXCA00a6HjUN_Mzm2wdqGz43Yd4-1Cc', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.904Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('Nt7m3-noqU5SozK1MmreSNbuUFooGtLP', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.927Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('SIleU07DD2dgpBFo4uzKlyEvzRwsyEIM', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.950Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('YJ5Gsv4caPXtEof38_ezXSdAIj35CRnP', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.984Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('xUC2lbn5gU-D-SBmIVfDVj-BH4tF7K1O', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:33.022Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:34');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('eTA0fb7_oEXX6ZHQukuZsDctJVBYiX6w', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:31.959Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:32');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('dwuZWlKWnKq0I_Ewtu-QKBirBB3jbsCG', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.095Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('u72RN6usWbda1i3JOTNq5CaprswuZPRu', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.126Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('GSFF3_3ZY1uS3CvGVRG_48ruv08F_y2s', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.152Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('qMhqZGNuXR0CjAidYkCzp2fF9dPe14x2', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.177Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('dltX7Ed_ZzurHnph6cl1q3dGfBGxzcYV', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.208Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('l1NWsQ5AP9ufsGJXBFPDJ4-YhOpS7Ooy', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.410Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('MIFmoLE250DyXASPGHo_ewMbjzQbcqSx', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:31.954Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:32');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('wqPjE3EE_8r-YMoMOzj9T1Bmf2gZX-9v', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.089Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('6dDar2J9E-1TbHJw1aWTCQ0KgArwiaNb', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.124Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('o9PVOQWwENXYq2hsz_1HHlqTv_x0aVKM', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.164Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('RZs97fv1QH2icQPgHCld5J1JeA9R-n9d', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.216Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('UENRdeKzY8PTl1LNVejTeL7cClaTtAOS', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.244Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('WjmE-P__c6JS6vUYTa8kDjMLUny4OGHt', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.279Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('wO4fyluXy1xq1cUzCjQR9C6pJteGN_8J', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.316Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('KKtgAkyfJdHBjVrdCnAvZk_RxGebeLn6', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.358Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('xqN1FSd86Thlpi7iCO-orPJxdDU1qZkf', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.485Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('eNiyOwirqZIEh6ZrGkfax06gQmULCyiM', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.517Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('b7Y-Zopju3e03FXYJCmNvYUsqQ00Y5ab', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.548Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('y9PQfUy_bkWkSztd8gl9P6ehHpSVhh41', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.577Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('i0pFV9NyDu3v4TBnKhhhmlPBaZtXxegp', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.617Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('5Lw5rPoqnX__gQy6bW6c3fhBGQSYRi7g', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.646Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('JH_MgKnosDXLvlSOFg2e3K3YFHZnBrOr', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.672Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('u7gxMH7DvJB-8AsngoJWgm3pYWsnUUWb', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.698Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('2RpfiY70xN-5XeDwPI87fDjLpdg9jKYE', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.723Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('5K9-v0WFByKYRQa_ySxQ8dFosAJFeB42', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.849Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('U_x8Pi8KO1TO7Kj2vas0PNYiVnud0Uil', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.883Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('udrcqjXoJSNMBLoofqM6qY8ENGWFi-tr', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.911Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('Yv-fE8odsMpyDulNAncuwUNNCAItKj13', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.936Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('Hi2Aiq3um6Uf6_9-mTM0xhIeYtbGQz_L', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:31.980Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:32');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('qPDmksg3hOYoWYLkfKSSg5uNRV0ibJUp', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.110Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('NUn9U9DjP_2sPE4nF-OQllpJOhBh0p7v', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.140Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('vmUoOsZhr2JP0PYQHAQrJ3ryQedoJob4', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.171Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('1ts5bukX_D6K8NXjLns4FGx_Zwbzoy8G', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.213Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('acGuFaNqMxP1yeF65WxlOrvYxjxwpdkA', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.249Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('sst0dErJu6RmVNRBuUD7nqHbcdjgbjYe', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.277Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('PMVJSzDhOarIVeD28a5HAxMXLXnAgXrT', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.318Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('77Zm4ZVGxczaUyafsQzR2ZqDWvdM4KDG', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.356Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('WVXkePDRz8AwzJuChqG9Qrj8HMrJTMTC', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.407Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('GoO9cj5V8cmsF12Z5AlBVpRL3zw1cr1U', '{"cookie":{"originalMaxAge":2591999999,"expires":"2025-11-03T11:42:32.449Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('uedsrsuuqQa6C7XpedhDWwANJTxU4oTB', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.505Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('2b_LA9Nj5UCFIBtNP7JOVpgW6hUyh454', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.540Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('X24INrJfjem2FkFpH_6R7XX1ky9E5w1W', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.566Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('-ApDDP8qggW4K1VssPCHbKMxc4JqNtKH', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.600Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('dUR8ia6soNInuozls-khk8jx8McbjQAS', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.635Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('_gHQi5IFGdmLSTmqzd-QInBw45dvNx7P', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.660Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('MGAecZ37iJ7GTAJX2bmSwgqn7YA8W1nx', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.685Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('O7HsV2vy4_uG9VjjlTvx7b3UmnJtXNc-', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.710Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('PP1_J_mDC8bDCskxsVqj5dODs3tgpPpG', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.734Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('fWTGiiAeM3oqiu5Yf_MRAjNYEqtIxGJj', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.777Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('EI-56_66iWrNV7ORAzI6FhuHyILLAFoR', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.806Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('1JcDj4EgLTmtICKRyoiwmNpWx7vxTGIl', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.848Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('uO4g5lqMYtw2pB-6P9xt7K-9g7GlK5c8', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.885Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('Uiuc6fI5fdVAVtT0CWfWBQLfSSPakEou', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.912Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('4iB_QdakLNjEnMDSrvFjsii_SzL-QbDD', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.937Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('iED7q-z4QahKwO3zgVLtg3G7Wfs5PGet', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:32.972Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:33');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('cvd3tldK90ZwUEtsrvZs2bUxnO848oYC', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:33.026Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:34');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('GIVqU6w3VSq6EbcsZ9IS4eTrerYdFKE-', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:31.915Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:32');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('nVPZ8PaDGJDda0WABzv-E7wmnEw9Ev9V', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:31.962Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:32');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('iyQDZOkj25EcrdylIffB12uZiCvLg39a', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-03T11:42:31.982Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"}}', '2025-11-03 11:42:32');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('m_-iiqbTUUcJKgFKNKCqYhDn4L63reWQ', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-10-05T12:55:40.455Z","secure":false,"httpOnly":false,"path":"/","sameSite":"none"},"user":{"id":"427caac4-81c4-4d8e-a2c8-f7e46c49ef88","email":"hello@redcats.agency","passwordHash":"$2b$12$ATYOyS7d/ZTXJqrQaL.s9uiabayjabRGPAUrKbrc.LmLwSRYG/Voa","firstName":"Алег","lastName":"Кошик","avatar":null,"role":"admin","isActive":true,"lastLoginAt":"2025-08-23T12:14:23.260Z","createdAt":"2025-08-20T21:00:26.622Z","updatedAt":"2025-09-05T12:55:29.316Z"}}', '2025-11-04 07:26:15');


--
-- Data for Name: unique_card_response_idx; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: user_brands; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_brands (id, user_id, name, description, logo, status, total_progress, completed_at, created_at, updated_at) VALUES ('5ef5c74c-b29a-45f0-9ab1-79db8b1041d4', 'a46fac7d-2b68-42fe-83ee-0bf3bfb37d14', 'Red Cats Agency', 'Креативне агентство повного циклу', NULL, 'active', 0, NULL, '2025-08-18 19:11:21.332901', '2025-08-18 19:11:21.332901');
INSERT INTO public.user_brands (id, user_id, name, description, logo, status, total_progress, completed_at, created_at, updated_at) VALUES ('67e27529-8d5b-4bd8-b61b-1a4b19bb3de7', 'a46fac7d-2b68-42fe-83ee-0bf3bfb37d14', 'DUSHA', 'Бренд онсалтингу', NULL, 'active', 0, NULL, '2025-08-18 19:25:08.600642', '2025-08-18 19:25:08.600642');
INSERT INTO public.user_brands (id, user_id, name, description, logo, status, total_progress, completed_at, created_at, updated_at) VALUES ('7c204d5e-556e-49ea-bd5d-07490ee15c95', 'a46fac7d-2b68-42fe-83ee-0bf3bfb37d14', 'Test Brand', 'Тестовий бренд для перевірки функціональності', NULL, 'active', 0, NULL, '2025-08-18 20:48:19.485741', '2025-08-18 20:48:19.485741');
INSERT INTO public.user_brands (id, user_id, name, description, logo, status, total_progress, completed_at, created_at, updated_at) VALUES ('59484ea5-8768-4b1f-ab5a-7e4cb137fc50', '427caac4-81c4-4d8e-a2c8-f7e46c49ef88', 'Душа Бренду', 'Трансформаційно стратегічна гра ', NULL, 'active', 0, NULL, '2025-08-20 21:01:44.396603', '2025-08-20 21:01:44.396603');
INSERT INTO public.user_brands (id, user_id, name, description, logo, status, total_progress, completed_at, created_at, updated_at) VALUES ('5ab9013d-aa2c-4fff-adc0-731651feab25', 'a46fac7d-2b68-42fe-83ee-0bf3bfb37d14', 'БРЕНД', 'Опис Бренду', NULL, 'active', 0, NULL, '2025-08-22 18:29:57.066101', '2025-08-22 18:29:57.066101');
INSERT INTO public.user_brands (id, user_id, name, description, logo, status, total_progress, completed_at, created_at, updated_at) VALUES ('46200524-4759-4891-bf3e-f7848de3245e', 'a46fac7d-2b68-42fe-83ee-0bf3bfb37d14', 'Dashbrand ', 'Descr', NULL, 'active', 0, NULL, '2025-08-22 20:31:49.558052', '2025-08-22 20:31:49.558052');
INSERT INTO public.user_brands (id, user_id, name, description, logo, status, total_progress, completed_at, created_at, updated_at) VALUES ('a982ed96-bccb-424c-9531-02d19ad55b0a', 'a46fac7d-2b68-42fe-83ee-0bf3bfb37d14', 'REGULUS', ' Опис', NULL, 'active', 0, NULL, '2025-09-05 12:47:28.042577', '2025-09-05 12:47:28.042577');


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_profiles (id, user_id, bio, company, "position", website, social_links, skills, interests, achievements, total_xp, level, created_at, updated_at) VALUES ('df27efac-fc89-400d-b12b-f80b41f5934f', 'a46fac7d-2b68-42fe-83ee-0bf3bfb37d14', NULL, NULL, NULL, NULL, '{}', '[]', '[]', '[]', 0, 1, '2025-08-18 19:10:58.215362', '2025-08-18 19:10:58.215362');
INSERT INTO public.user_profiles (id, user_id, bio, company, "position", website, social_links, skills, interests, achievements, total_xp, level, created_at, updated_at) VALUES ('7a23382e-a88c-4b08-aff4-dfe75ac3233e', '8bdb7418-fa12-4f75-a8cf-1bbb4d3f290b', NULL, NULL, NULL, NULL, '{}', '[]', '[]', '[]', 0, 1, '2025-08-20 19:46:38.370841', '2025-08-20 19:46:38.370841');
INSERT INTO public.user_profiles (id, user_id, bio, company, "position", website, social_links, skills, interests, achievements, total_xp, level, created_at, updated_at) VALUES ('a3fc2fac-c1d1-4b13-8b7e-e38e0c3ad3ac', '427caac4-81c4-4d8e-a2c8-f7e46c49ef88', NULL, NULL, NULL, NULL, '{}', '[]', '[]', '[]', 0, 1, '2025-08-20 21:00:26.696918', '2025-08-20 21:00:26.696918');


--
-- Data for Name: user_settings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_settings (id, user_id, language, theme, notifications, game_preferences, created_at, updated_at) VALUES ('5b401f20-6f8a-45e5-a185-10bba7fc5faf', 'a46fac7d-2b68-42fe-83ee-0bf3bfb37d14', 'uk', 'light', '{"email": true, "push": true}', '{}', '2025-08-18 19:10:58.215362', '2025-08-18 19:10:58.215362');
INSERT INTO public.user_settings (id, user_id, language, theme, notifications, game_preferences, created_at, updated_at) VALUES ('adb7aa89-a95f-47de-913e-4aa120d71682', '8bdb7418-fa12-4f75-a8cf-1bbb4d3f290b', 'uk', 'light', '{"email": true, "push": true}', '{}', '2025-08-20 19:46:38.344672', '2025-08-20 19:46:38.344672');
INSERT INTO public.user_settings (id, user_id, language, theme, notifications, game_preferences, created_at, updated_at) VALUES ('caad10eb-7ef6-4258-b379-eb2a47c8bf2e', '427caac4-81c4-4d8e-a2c8-f7e46c49ef88', 'uk', 'light', '{"email": true, "push": true}', '{}', '2025-08-20 21:00:26.659416', '2025-08-20 21:00:26.659416');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, email, password_hash, first_name, last_name, avatar, is_active, last_login_at, created_at, updated_at, role) VALUES ('8bdb7418-fa12-4f75-a8cf-1bbb4d3f290b', 'test@test.com', '$2b$12$YQSk9QyrK8D9gSltb0lL4.w3S.OgaTwx3u98Di25AksW8SQR0rjY6', 'Test', 'User', NULL, true, NULL, '2025-08-20 19:46:38.315976', '2025-08-20 19:46:38.315976', 'user');
INSERT INTO public.users (id, email, password_hash, first_name, last_name, avatar, is_active, last_login_at, created_at, updated_at, role) VALUES ('a46fac7d-2b68-42fe-83ee-0bf3bfb37d14', 'aleg@redcats.agency', '$2b$12$4m5ZO7P4B7GF3c0KFectbuN8XCl4plLdt6tUQzzsHUbslXS5KHNtG', 'Олег', 'Червінський', NULL, true, '2025-09-05 12:46:57.403', '2025-08-18 19:10:37.827602', '2025-09-05 12:46:57.403', 'user');
INSERT INTO public.users (id, email, password_hash, first_name, last_name, avatar, is_active, last_login_at, created_at, updated_at, role) VALUES ('427caac4-81c4-4d8e-a2c8-f7e46c49ef88', 'hello@redcats.agency', '$2b$12$ATYOyS7d/ZTXJqrQaL.s9uiabayjabRGPAUrKbrc.LmLwSRYG/Voa', 'Алег', 'Кошик', NULL, true, '2025-09-05 12:55:40.428', '2025-08-20 21:00:26.622869', '2025-09-05 12:55:40.428', 'admin');


--
-- Name: card_properties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.card_properties_id_seq', 87, true);


--
-- Name: card_relations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.card_relations_id_seq', 14, true);


--
-- Name: card_responses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.card_responses_id_seq', 254, true);


--
-- Name: card_option_set_links card_option_set_links_card_id_option_set_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_option_set_links
    ADD CONSTRAINT card_option_set_links_card_id_option_set_id_key UNIQUE (card_id, option_set_id);


--
-- Name: card_option_set_links card_option_set_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_option_set_links
    ADD CONSTRAINT card_option_set_links_pkey PRIMARY KEY (id);


--
-- Name: card_option_sets card_option_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_option_sets
    ADD CONSTRAINT card_option_sets_pkey PRIMARY KEY (id);


--
-- Name: card_options card_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_options
    ADD CONSTRAINT card_options_pkey PRIMARY KEY (id);


--
-- Name: card_properties card_properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_properties
    ADD CONSTRAINT card_properties_pkey PRIMARY KEY (id);


--
-- Name: card_relations card_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_relations
    ADD CONSTRAINT card_relations_pkey PRIMARY KEY (id);


--
-- Name: card_responses card_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_responses
    ADD CONSTRAINT card_responses_pkey PRIMARY KEY (id);


--
-- Name: game_cards game_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_cards
    ADD CONSTRAINT game_cards_pkey PRIMARY KEY (id);


--
-- Name: game_levels game_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_levels
    ADD CONSTRAINT game_levels_pkey PRIMARY KEY (id);


--
-- Name: game_sessions game_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_sessions
    ADD CONSTRAINT game_sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: unique_card_response_idx unique_card_response_idx_session_id_card_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unique_card_response_idx
    ADD CONSTRAINT unique_card_response_idx_session_id_card_id_pk PRIMARY KEY (session_id, card_id);


--
-- Name: user_brands user_brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_brands
    ADD CONSTRAINT user_brands_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_expire ON public.sessions USING btree (expire);


--
-- Name: unique_session_card_response; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_session_card_response ON public.card_responses USING btree (session_id, card_id);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: card_option_set_links card_option_set_links_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_option_set_links
    ADD CONSTRAINT card_option_set_links_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.game_cards(id) ON DELETE CASCADE;


--
-- Name: card_option_set_links card_option_set_links_option_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_option_set_links
    ADD CONSTRAINT card_option_set_links_option_set_id_fkey FOREIGN KEY (option_set_id) REFERENCES public.card_option_sets(id) ON DELETE CASCADE;


--
-- Name: card_options card_options_option_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_options
    ADD CONSTRAINT card_options_option_set_id_fkey FOREIGN KEY (option_set_id) REFERENCES public.card_option_sets(id) ON DELETE CASCADE;


--
-- Name: card_properties card_properties_card_id_game_cards_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_properties
    ADD CONSTRAINT card_properties_card_id_game_cards_id_fk FOREIGN KEY (card_id) REFERENCES public.game_cards(id);


--
-- Name: card_relations card_relations_from_card_id_game_cards_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_relations
    ADD CONSTRAINT card_relations_from_card_id_game_cards_id_fk FOREIGN KEY (from_card_id) REFERENCES public.game_cards(id);


--
-- Name: card_relations card_relations_to_card_id_game_cards_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_relations
    ADD CONSTRAINT card_relations_to_card_id_game_cards_id_fk FOREIGN KEY (to_card_id) REFERENCES public.game_cards(id);


--
-- Name: card_responses card_responses_card_id_game_cards_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_responses
    ADD CONSTRAINT card_responses_card_id_game_cards_id_fk FOREIGN KEY (card_id) REFERENCES public.game_cards(id);


--
-- Name: card_responses card_responses_session_id_game_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_responses
    ADD CONSTRAINT card_responses_session_id_game_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.game_sessions(id);


--
-- Name: game_cards game_cards_level_id_game_levels_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_cards
    ADD CONSTRAINT game_cards_level_id_game_levels_id_fk FOREIGN KEY (level_id) REFERENCES public.game_levels(id);


--
-- Name: game_sessions game_sessions_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_sessions
    ADD CONSTRAINT game_sessions_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.user_brands(id);


--
-- Name: user_brands user_brands_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_brands
    ADD CONSTRAINT user_brands_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_settings user_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

