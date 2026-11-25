--
-- PostgreSQL database dump
--

\restrict eaxGHL7TwrW8APnRrc2pCdneNCY9hzL51WWv9vPnEYbPGmtd12RrdkJbheAwFlS

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tickets DROP CONSTRAINT IF EXISTS tickets_requester_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tickets DROP CONSTRAINT IF EXISTS tickets_incident_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tickets DROP CONSTRAINT IF EXISTS tickets_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tickets DROP CONSTRAINT IF EXISTS tickets_assignee_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tickets DROP CONSTRAINT IF EXISTS tickets_asset_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ticket_sla_snapshots DROP CONSTRAINT IF EXISTS ticket_sla_snapshots_ticket_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ticket_sla_snapshots DROP CONSTRAINT IF EXISTS ticket_sla_snapshots_policy_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ticket_comments DROP CONSTRAINT IF EXISTS ticket_comments_ticket_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ticket_comments DROP CONSTRAINT IF EXISTS ticket_comments_author_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ticket_attachments DROP CONSTRAINT IF EXISTS ticket_attachments_uploader_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ticket_attachments DROP CONSTRAINT IF EXISTS ticket_attachments_ticket_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ticket_activity_logs DROP CONSTRAINT IF EXISTS ticket_activity_logs_ticket_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ticket_activity_logs DROP CONSTRAINT IF EXISTS ticket_activity_logs_actor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_permission_id_fkey;
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_recipient_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notification_deliveries DROP CONSTRAINT IF EXISTS notification_deliveries_notification_id_fkey;
ALTER TABLE IF EXISTS ONLY public.knowledge_articles DROP CONSTRAINT IF EXISTS knowledge_articles_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.knowledge_articles DROP CONSTRAINT IF EXISTS knowledge_articles_author_id_fkey;
ALTER TABLE IF EXISTS ONLY public.incidents DROP CONSTRAINT IF EXISTS incidents_reporter_id_fkey;
ALTER TABLE IF EXISTS ONLY public.incidents DROP CONSTRAINT IF EXISTS incidents_commander_id_fkey;
ALTER TABLE IF EXISTS ONLY public.incident_updates DROP CONSTRAINT IF EXISTS incident_updates_incident_id_fkey;
ALTER TABLE IF EXISTS ONLY public.incident_updates DROP CONSTRAINT IF EXISTS incident_updates_author_id_fkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_actor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assets DROP CONSTRAINT IF EXISTS assets_assigned_to_id_fkey;
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.tickets_ticket_number_key;
DROP INDEX IF EXISTS public.tickets_status_idx;
DROP INDEX IF EXISTS public.tickets_requester_id_idx;
DROP INDEX IF EXISTS public.tickets_priority_idx;
DROP INDEX IF EXISTS public.tickets_incident_id_idx;
DROP INDEX IF EXISTS public.tickets_assignee_id_idx;
DROP INDEX IF EXISTS public.ticket_sla_snapshots_ticket_id_key;
DROP INDEX IF EXISTS public.ticket_sla_snapshots_status_idx;
DROP INDEX IF EXISTS public.ticket_sla_snapshots_response_due_at_idx;
DROP INDEX IF EXISTS public.ticket_sla_snapshots_resolution_due_at_idx;
DROP INDEX IF EXISTS public.ticket_comments_type_idx;
DROP INDEX IF EXISTS public.ticket_comments_ticket_id_idx;
DROP INDEX IF EXISTS public.ticket_attachments_ticket_id_idx;
DROP INDEX IF EXISTS public.ticket_activity_logs_ticket_id_idx;
DROP INDEX IF EXISTS public.sla_policies_priority_key;
DROP INDEX IF EXISTS public.sla_policies_name_key;
DROP INDEX IF EXISTS public.roles_name_key;
DROP INDEX IF EXISTS public.refresh_tokens_user_id_idx;
DROP INDEX IF EXISTS public.refresh_tokens_token_hash_key;
DROP INDEX IF EXISTS public.refresh_tokens_family_idx;
DROP INDEX IF EXISTS public.permissions_name_key;
DROP INDEX IF EXISTS public.password_reset_tokens_user_id_idx;
DROP INDEX IF EXISTS public.password_reset_tokens_token_hash_key;
DROP INDEX IF EXISTS public.notifications_recipient_id_is_read_created_at_idx;
DROP INDEX IF EXISTS public.notification_deliveries_notification_id_channel_idx;
DROP INDEX IF EXISTS public.knowledge_articles_status_created_at_idx;
DROP INDEX IF EXISTS public.knowledge_articles_slug_key;
DROP INDEX IF EXISTS public.incidents_incident_number_key;
DROP INDEX IF EXISTS public.categories_name_key;
DROP INDEX IF EXISTS public.categories_code_key;
DROP INDEX IF EXISTS public.audit_logs_module_created_at_idx;
DROP INDEX IF EXISTS public.audit_logs_actor_id_idx;
DROP INDEX IF EXISTS public.audit_logs_action_created_at_idx;
DROP INDEX IF EXISTS public.assets_status_idx;
DROP INDEX IF EXISTS public.assets_assigned_to_id_idx;
DROP INDEX IF EXISTS public.assets_asset_tag_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_pkey;
ALTER TABLE IF EXISTS ONLY public.tickets DROP CONSTRAINT IF EXISTS tickets_pkey;
ALTER TABLE IF EXISTS ONLY public.ticket_sla_snapshots DROP CONSTRAINT IF EXISTS ticket_sla_snapshots_pkey;
ALTER TABLE IF EXISTS ONLY public.ticket_comments DROP CONSTRAINT IF EXISTS ticket_comments_pkey;
ALTER TABLE IF EXISTS ONLY public.ticket_attachments DROP CONSTRAINT IF EXISTS ticket_attachments_pkey;
ALTER TABLE IF EXISTS ONLY public.ticket_activity_logs DROP CONSTRAINT IF EXISTS ticket_activity_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.sla_policies DROP CONSTRAINT IF EXISTS sla_policies_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.platform_settings DROP CONSTRAINT IF EXISTS platform_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.permissions DROP CONSTRAINT IF EXISTS permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.notification_deliveries DROP CONSTRAINT IF EXISTS notification_deliveries_pkey;
ALTER TABLE IF EXISTS ONLY public.knowledge_articles DROP CONSTRAINT IF EXISTS knowledge_articles_pkey;
ALTER TABLE IF EXISTS ONLY public.incidents DROP CONSTRAINT IF EXISTS incidents_pkey;
ALTER TABLE IF EXISTS ONLY public.incident_updates DROP CONSTRAINT IF EXISTS incident_updates_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.assets DROP CONSTRAINT IF EXISTS assets_pkey;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_roles;
DROP TABLE IF EXISTS public.tickets;
DROP TABLE IF EXISTS public.ticket_sla_snapshots;
DROP TABLE IF EXISTS public.ticket_comments;
DROP TABLE IF EXISTS public.ticket_attachments;
DROP TABLE IF EXISTS public.ticket_activity_logs;
DROP TABLE IF EXISTS public.sla_policies;
DROP TABLE IF EXISTS public.roles;
DROP TABLE IF EXISTS public.role_permissions;
DROP TABLE IF EXISTS public.refresh_tokens;
DROP TABLE IF EXISTS public.platform_settings;
DROP TABLE IF EXISTS public.permissions;
DROP TABLE IF EXISTS public.password_reset_tokens;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.notification_deliveries;
DROP TABLE IF EXISTS public.knowledge_articles;
DROP TABLE IF EXISTS public.incidents;
DROP TABLE IF EXISTS public.incident_updates;
DROP TABLE IF EXISTS public.categories;
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.assets;
DROP TYPE IF EXISTS public."UserStatus";
DROP TYPE IF EXISTS public."Urgency";
DROP TYPE IF EXISTS public."TicketType";
DROP TYPE IF EXISTS public."TicketStatus";
DROP TYPE IF EXISTS public."TicketPriority";
DROP TYPE IF EXISTS public."SlaStatus";
DROP TYPE IF EXISTS public."RoleName";
DROP TYPE IF EXISTS public."NotificationType";
DROP TYPE IF EXISTS public."NotificationChannel";
DROP TYPE IF EXISTS public."KnowledgeStatus";
DROP TYPE IF EXISTS public."IncidentStatus";
DROP TYPE IF EXISTS public."IncidentSeverity";
DROP TYPE IF EXISTS public."Impact";
DROP TYPE IF EXISTS public."DeliveryStatus";
DROP TYPE IF EXISTS public."CommentType";
DROP TYPE IF EXISTS public."AssetType";
DROP TYPE IF EXISTS public."AssetStatus";
--
-- Name: AssetStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AssetStatus" AS ENUM (
    'IN_SERVICE',
    'IN_REPAIR',
    'FAILED',
    'RETIRED',
    'SPARE'
);


ALTER TYPE public."AssetStatus" OWNER TO postgres;

--
-- Name: AssetType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AssetType" AS ENUM (
    'LAPTOP',
    'DESKTOP',
    'DOCK',
    'MONITOR',
    'PRINTER',
    'NETWORK',
    'LICENSE',
    'OTHER'
);


ALTER TYPE public."AssetType" OWNER TO postgres;

--
-- Name: CommentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CommentType" AS ENUM (
    'PUBLIC',
    'INTERNAL_NOTE',
    'SYSTEM_EVENT'
);


ALTER TYPE public."CommentType" OWNER TO postgres;

--
-- Name: DeliveryStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DeliveryStatus" AS ENUM (
    'PENDING',
    'SENT',
    'FAILED'
);


ALTER TYPE public."DeliveryStatus" OWNER TO postgres;

--
-- Name: Impact; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Impact" AS ENUM (
    'ORGANIZATION',
    'DEPARTMENT',
    'USER'
);


ALTER TYPE public."Impact" OWNER TO postgres;

--
-- Name: IncidentSeverity; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."IncidentSeverity" AS ENUM (
    'CRITICAL_P1',
    'HIGH_P2',
    'MEDIUM_P3',
    'LOW_P4'
);


ALTER TYPE public."IncidentSeverity" OWNER TO postgres;

--
-- Name: IncidentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."IncidentStatus" AS ENUM (
    'DECLARED',
    'INVESTIGATING',
    'MITIGATED',
    'MONITORING',
    'RESOLVED'
);


ALTER TYPE public."IncidentStatus" OWNER TO postgres;

--
-- Name: KnowledgeStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."KnowledgeStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);


ALTER TYPE public."KnowledgeStatus" OWNER TO postgres;

--
-- Name: NotificationChannel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationChannel" AS ENUM (
    'IN_APP',
    'EMAIL'
);


ALTER TYPE public."NotificationChannel" OWNER TO postgres;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationType" AS ENUM (
    'TICKET_CREATED',
    'TICKET_ASSIGNED',
    'TICKET_UPDATED',
    'TICKET_COMMENTED',
    'TICKET_RESOLVED',
    'TICKET_CLOSED',
    'SLA_WARNING',
    'SLA_BREACHED',
    'INCIDENT_DECLARED',
    'INCIDENT_UPDATED',
    'SYSTEM'
);


ALTER TYPE public."NotificationType" OWNER TO postgres;

--
-- Name: RoleName; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RoleName" AS ENUM (
    'EMPLOYEE',
    'IT_SUPPORT_AGENT',
    'IT_MANAGER',
    'SYSTEM_ADMINISTRATOR'
);


ALTER TYPE public."RoleName" OWNER TO postgres;

--
-- Name: SlaStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SlaStatus" AS ENUM (
    'ON_TRACK',
    'AT_RISK',
    'BREACHED',
    'PAUSED',
    'MET'
);


ALTER TYPE public."SlaStatus" OWNER TO postgres;

--
-- Name: TicketPriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TicketPriority" AS ENUM (
    'CRITICAL_P1',
    'HIGH_P2',
    'MEDIUM_P3',
    'LOW_P4'
);


ALTER TYPE public."TicketPriority" OWNER TO postgres;

--
-- Name: TicketStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TicketStatus" AS ENUM (
    'NEW',
    'ASSIGNED',
    'IN_PROGRESS',
    'PENDING_CUSTOMER',
    'RESOLVED',
    'CLOSED',
    'CANCELLED'
);


ALTER TYPE public."TicketStatus" OWNER TO postgres;

--
-- Name: TicketType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TicketType" AS ENUM (
    'SERVICE_REQUEST',
    'INCIDENT'
);


ALTER TYPE public."TicketType" OWNER TO postgres;

--
-- Name: Urgency; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Urgency" AS ENUM (
    'CRITICAL',
    'HIGH',
    'MEDIUM',
    'LOW'
);


ALTER TYPE public."Urgency" OWNER TO postgres;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'DEACTIVATED',
    'LOCKED',
    'PENDING_APPROVAL'
);


ALTER TYPE public."UserStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assets (
    id text NOT NULL,
    asset_tag text NOT NULL,
    name text NOT NULL,
    asset_type public."AssetType" DEFAULT 'LAPTOP'::public."AssetType" NOT NULL,
    serial_number text,
    location text,
    status public."AssetStatus" DEFAULT 'IN_SERVICE'::public."AssetStatus" NOT NULL,
    assigned_to_id text,
    warranty_until timestamp(3) without time zone,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.assets OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    actor_id text,
    actor_email text DEFAULT 'system@serviceops.local'::text NOT NULL,
    actor_name text DEFAULT 'System'::text NOT NULL,
    action text NOT NULL,
    module text NOT NULL,
    resource_type text NOT NULL,
    resource_id text,
    ip_address text,
    before_state jsonb,
    after_state jsonb,
    metadata jsonb,
    checksum text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    icon text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    default_priority public."TicketPriority" DEFAULT 'MEDIUM_P3'::public."TicketPriority" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    subcategories text[] DEFAULT ARRAY[]::text[]
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: incident_updates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.incident_updates (
    id text NOT NULL,
    incident_id text NOT NULL,
    author_id text NOT NULL,
    message text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.incident_updates OWNER TO postgres;

--
-- Name: incidents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.incidents (
    id text NOT NULL,
    incident_number text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    severity public."IncidentSeverity" DEFAULT 'HIGH_P2'::public."IncidentSeverity" NOT NULL,
    status public."IncidentStatus" DEFAULT 'INVESTIGATING'::public."IncidentStatus" NOT NULL,
    impact_scope text,
    root_cause text,
    workaround text,
    reporter_id text NOT NULL,
    commander_id text,
    resolved_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.incidents OWNER TO postgres;

--
-- Name: knowledge_articles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knowledge_articles (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    summary text,
    content text NOT NULL,
    category_id text,
    status public."KnowledgeStatus" DEFAULT 'DRAFT'::public."KnowledgeStatus" NOT NULL,
    author_id text NOT NULL,
    read_minutes integer DEFAULT 3 NOT NULL,
    helpful_count integer DEFAULT 0 NOT NULL,
    views_count integer DEFAULT 0 NOT NULL,
    tags text[] DEFAULT ARRAY[]::text[],
    published_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.knowledge_articles OWNER TO postgres;

--
-- Name: notification_deliveries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_deliveries (
    id text NOT NULL,
    notification_id text NOT NULL,
    channel public."NotificationChannel" NOT NULL,
    status public."DeliveryStatus" DEFAULT 'PENDING'::public."DeliveryStatus" NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    last_error text,
    sent_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.notification_deliveries OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    recipient_id text NOT NULL,
    type public."NotificationType" DEFAULT 'SYSTEM'::public."NotificationType" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    entity_type text,
    entity_id text,
    link_url text,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    id text NOT NULL,
    token_hash text NOT NULL,
    user_id text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    used_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id text NOT NULL,
    name text NOT NULL,
    module text NOT NULL,
    description text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_settings (
    key text NOT NULL,
    category text NOT NULL,
    value text NOT NULL,
    updated_by_id text,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.platform_settings OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id text NOT NULL,
    token_hash text NOT NULL,
    user_id text NOT NULL,
    family text NOT NULL,
    is_revoked boolean DEFAULT false NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_agent text,
    ip_address text
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    role_id text NOT NULL,
    permission_id text NOT NULL,
    assigned_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id text NOT NULL,
    name public."RoleName" NOT NULL,
    display_name text NOT NULL,
    description text,
    is_system boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: sla_policies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sla_policies (
    id text NOT NULL,
    name text NOT NULL,
    priority public."TicketPriority" NOT NULL,
    description text,
    response_target_minutes integer NOT NULL,
    resolution_target_minutes integer NOT NULL,
    business_hours_only boolean DEFAULT true NOT NULL,
    warning_threshold_pct integer DEFAULT 75 NOT NULL,
    business_start_hour integer DEFAULT 8 NOT NULL,
    business_end_hour integer DEFAULT 18 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.sla_policies OWNER TO postgres;

--
-- Name: ticket_activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_activity_logs (
    id text NOT NULL,
    ticket_id text NOT NULL,
    actor_id text,
    action text NOT NULL,
    old_value text,
    new_value text,
    details text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ticket_activity_logs OWNER TO postgres;

--
-- Name: ticket_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_attachments (
    id text NOT NULL,
    ticket_id text NOT NULL,
    uploader_id text NOT NULL,
    file_name text NOT NULL,
    file_size integer NOT NULL,
    mime_type text NOT NULL,
    storage_key text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ticket_attachments OWNER TO postgres;

--
-- Name: ticket_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_comments (
    id text NOT NULL,
    ticket_id text NOT NULL,
    author_id text NOT NULL,
    type public."CommentType" DEFAULT 'PUBLIC'::public."CommentType" NOT NULL,
    content text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ticket_comments OWNER TO postgres;

--
-- Name: ticket_sla_snapshots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_sla_snapshots (
    id text NOT NULL,
    ticket_id text NOT NULL,
    policy_id text NOT NULL,
    response_target_minutes integer NOT NULL,
    resolution_target_minutes integer NOT NULL,
    response_due_at timestamp(3) without time zone NOT NULL,
    resolution_due_at timestamp(3) without time zone NOT NULL,
    first_response_at timestamp(3) without time zone,
    resolved_at timestamp(3) without time zone,
    is_response_met boolean,
    is_resolution_met boolean,
    paused_at timestamp(3) without time zone,
    total_paused_minutes integer DEFAULT 0 NOT NULL,
    status public."SlaStatus" DEFAULT 'ON_TRACK'::public."SlaStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    breach_notified_at timestamp(3) without time zone,
    warning_notified_at timestamp(3) without time zone
);


ALTER TABLE public.ticket_sla_snapshots OWNER TO postgres;

--
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id text NOT NULL,
    ticket_number text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    type public."TicketType" DEFAULT 'SERVICE_REQUEST'::public."TicketType" NOT NULL,
    status public."TicketStatus" DEFAULT 'NEW'::public."TicketStatus" NOT NULL,
    priority public."TicketPriority" DEFAULT 'MEDIUM_P3'::public."TicketPriority" NOT NULL,
    impact public."Impact" DEFAULT 'USER'::public."Impact" NOT NULL,
    urgency public."Urgency" DEFAULT 'MEDIUM'::public."Urgency" NOT NULL,
    category_id text NOT NULL,
    requester_id text NOT NULL,
    assignee_id text,
    response_due_at timestamp(3) without time zone,
    resolution_due_at timestamp(3) without time zone,
    first_response_at timestamp(3) without time zone,
    resolved_at timestamp(3) without time zone,
    closed_at timestamp(3) without time zone,
    resolution_summary text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    incident_id text,
    asset_id text
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    user_id text NOT NULL,
    role_id text NOT NULL,
    assigned_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    department text,
    job_title text,
    phone text,
    status public."UserStatus" DEFAULT 'ACTIVE'::public."UserStatus" NOT NULL,
    failed_login_attempts integer DEFAULT 0 NOT NULL,
    lockout_until timestamp(3) without time zone,
    two_factor_enabled boolean DEFAULT false NOT NULL,
    two_factor_secret text,
    last_login_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assets (id, asset_tag, name, asset_type, serial_number, location, status, assigned_to_id, warranty_until, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, actor_id, actor_email, actor_name, action, module, resource_type, resource_id, ip_address, before_state, after_state, metadata, checksum, created_at) FROM stdin;
488b68f4-e3d0-4fcd-833b-b83010beacf7	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	auth.login	auth	Session	admin@serviceops.local	::ffff:127.0.0.1	\N	{"roles": ["SYSTEM_ADMINISTRATOR"]}	\N	77d10e8b49765e49b288ddeb9c90abce981da0ea85b173ddbb89e540d4c45452	2026-11-15 06:43:49.833
2e10fc5a-ad54-432a-8d21-0bc92bf694b3	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	auth.login	auth	Session	admin@serviceops.local	::1	\N	{"roles": ["SYSTEM_ADMINISTRATOR"]}	\N	aedc018d7faa6c0877d8eae0a32daff6148672d063347678f4462e41cd9c5516	2026-11-15 08:01:16.275
da479b42-a32a-4275-b8d3-0cf159c1dd37	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	role.grant	users	User	employee@serviceops.local	\N	{"roles": ["EMPLOYEE"]}	{"roles": ["IT_MANAGER"]}	\N	ec1d565816dd308ddd4ad63a98d0dea11be6def6ed3b31df77f6a46afad1363e	2026-11-15 08:01:34.907
d1b15718-5082-49c6-941f-f52aee19d5f5	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	auth.login	auth	Session	admin@serviceops.local	::ffff:127.0.0.1	\N	{"roles": ["SYSTEM_ADMINISTRATOR"]}	\N	4e12c4d6303b75f6d28f9f804ce2345e43c81ce69183875feb4d1de836b01301	2026-11-15 09:17:02.12
32f2508a-f500-4cda-ae05-8f5377b669e3	\N	employee@serviceops.local	Amina Perera	auth.login	auth	Session	employee@serviceops.local	::ffff:127.0.0.1	\N	{"roles": ["EMPLOYEE"]}	\N	4affd92b6da19e99ae26973dc767faf1e7f660035668c0ebecc5f5654be3bf68	2026-11-15 06:43:49.622
bb42072d-6a28-4951-aa76-526a69eeb255	\N	employee@serviceops.local	Amina Perera	auth.login	auth	Session	employee@serviceops.local	::1	\N	{"roles": ["EMPLOYEE"]}	\N	e5381a09e8d38b99780daf4b678bf7e191f58e79cffcb59b2e72fdfafdf6483b	2026-11-15 07:34:45.55
313db99c-cb8d-4b80-a00c-f052893109ca	\N	employee@serviceops.local	Amina Perera	auth.login	auth	Session	employee@serviceops.local	::1	\N	{"roles": ["EMPLOYEE"]}	\N	3cf337b8d50ac22c71214327d38a1db5dcf8f0b99c27097f7f53632df07faa63	2026-11-15 07:34:47.876
397edb1a-bf28-4afa-8721-dac07ae89c78	\N	employee@serviceops.local	Amina Perera	auth.login	auth	Session	employee@serviceops.local	::1	\N	{"roles": ["IT_MANAGER"]}	\N	b8f3d582e5570213a26b6ac9c216481479f671dddaba3de2f4dc5220e8e293c4	2026-11-15 08:02:29.791
adf6a112-339e-4cde-bd3f-0bf4a29743c1	\N	employee@serviceops.local	Amina Perera	auth.login	auth	Session	employee@serviceops.local	::1	\N	{"roles": ["IT_MANAGER"]}	\N	c41625f587495a712e302d78ca2d014cf44f52fc9c7a089da1afb0df29050cb7	2026-11-15 08:55:16.886
eb83b42a-ff39-4816-aba5-7aec588d409d	\N	employee@serviceops.local	Amina Perera	auth.login	auth	Session	employee@serviceops.local	::ffff:127.0.0.1	\N	{"roles": ["IT_MANAGER"]}	\N	64c8d3725c33aab85b6b9102e6c770e4261297c767d7bcbd2d236e89049cedb9	2026-11-15 09:17:01.938
08978a87-e79a-441a-98d2-6888a3189a68	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	auth.login	auth	Session	admin@serviceops.local	::ffff:127.0.0.1	\N	{"roles": ["SYSTEM_ADMINISTRATOR"]}	\N	98437d4fa3c999880a66fe40a70b81f444c048be52424f3bec82e59678ce01a2	2026-11-15 13:04:55.998
d6bc9e48-c5a0-40b5-b01a-e9fd0be60fb6	\N	test.employee.1794747894820@serviceops.local	Test Employee	auth.login	auth	Session	test.employee.1794747894820@serviceops.local	::ffff:127.0.0.1	\N	{"roles": ["EMPLOYEE"]}	\N	c7415cbcd96fd5ad32bf131872b840efe638cb29cab8bb43c6d097fa0cca36e7	2026-11-15 13:04:55.741
da0e545a-62b0-425f-949a-e05d2be42459	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	auth.login	auth	Session	admin@serviceops.local	::1	\N	{"roles": ["SYSTEM_ADMINISTRATOR"]}	\N	94405d5d52d852bbc71b7a36c750012eee62e5b4bcfed7e60c31bb634aff07d8	2026-11-15 17:21:52.989
74f4a47d-b3ad-4a9b-a4ed-680b3ba50170	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	auth.login	auth	Session	admin@serviceops.local	::1	\N	{"roles": ["SYSTEM_ADMINISTRATOR"]}	\N	fdd7d2ba53c619fdaa4f8670f28a0a3bb99bae471a5bd70f9a1bf06fa5beeffc	2026-11-15 19:10:34.755
f1660711-f854-4b65-a292-cb793c2e6b03	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	auth.login	auth	Session	admin@serviceops.local	::1	\N	{"roles": ["SYSTEM_ADMINISTRATOR"]}	\N	cd25a2771954c4efefd3b688b9d39703b4ac9a47171bd0adc9650ea19ac5ef3f	2026-11-16 08:14:53.264
7c57eba3-de42-44e9-ad80-09df217e947e	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	auth.login	auth	Session	admin@serviceops.local	::1	\N	{"roles": ["SYSTEM_ADMINISTRATOR"]}	\N	f27817cd195b0cf62696f761e4cedbe616a20556c02a68941ae9abdaebdd161e	2026-11-16 08:14:56.153
47b54a93-db05-4780-963b-52ae848e5fcf	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	auth.login	auth	Session	admin@serviceops.local	::1	\N	{"roles": ["SYSTEM_ADMINISTRATOR"]}	\N	b51db3be5fe122774c9eda4e7d7c3440d03a53c25017693221e07b8bb2d56924	2026-11-17 19:40:31.534
19c00ad4-216f-4282-a957-6b2c85bf0563	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	tharushasangeeth034@gmail.com	Tharusha Sangeeth	auth.login	auth	Session	tharushasangeeth034@gmail.com	::1	\N	{"roles": ["EMPLOYEE"]}	\N	600a839a146108e62723cf75cd1cbc1a3496340c8d607de3c71225d5ae7991c1	2026-11-17 19:41:52.813
bc0fa3b6-ce01-4945-bf9e-3d8321a5ff59	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	auth.login	auth	Session	admin@serviceops.local	::1	\N	{"roles": ["SYSTEM_ADMINISTRATOR"]}	\N	657220604ecaa23c2036d0d723bb125cafa8941db6e4c009d428404276c3957e	2026-11-21 06:17:35.506
ceaf7c60-7af6-4faa-9e81-143b0b57c387	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	user.status	users	User	employee_1795241855533@test.local	\N	{"status": "PENDING_APPROVAL"}	{"status": "ACTIVE"}	\N	64b53b65ba784f25a29cf33d2434c3b538a79657042931707a28a773da1c2654	2026-11-21 06:17:36.072
f1a4e990-2771-4eed-87db-561042f4728e	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	auth.login	auth	Session	admin@serviceops.local	::1	\N	{"roles": ["SYSTEM_ADMINISTRATOR"]}	\N	28f658e12d90746136d5106b9b4931c23e51ef452b8ca9873f87c5d61c04630b	2026-11-21 06:25:39.602
20c395d5-43dd-41a5-ba81-ce753d9d9700	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	user.status	users	User	employee_1795242339616@test.local	\N	{"status": "PENDING_APPROVAL"}	{"status": "ACTIVE"}	\N	eca475ecdf271c262bc2d177e340c8a3695b45dabc2e7b80f9aac94f13cc0b6c	2026-11-21 06:25:39.801
0b698f55-0493-4451-b02f-79809a03d5cd	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	tharushasangeeth034@gmail.com	Tharusha Sangeeth	auth.login	auth	Session	tharushasangeeth034@gmail.com	::1	\N	{"roles": ["EMPLOYEE"]}	\N	441010ea48ac0fe04945f4f2ccc41ade7c3c2f1353cc6598ef068d66986b1d9e	2026-11-21 07:49:21.793
4d3d5c1f-8b96-452f-8984-b762dcec446c	\N	employee_1795242339616@test.local	Tharusha Perera	auth.login	auth	Session	employee_1795242339616@test.local	::1	\N	{"roles": ["EMPLOYEE"]}	\N	3c0f8d1d8900a98b591fe09a5272cffa4c275f9b3b79beca1dbab0cede5fb451	2026-11-21 06:25:39.944
dd194d20-0067-4d0a-bf65-df99710b4ba6	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	tharushasangeeth034@gmail.com	Tharusha Sangeeth	auth.login	auth	Session	tharushasangeeth034@gmail.com	::1	\N	{"roles": ["EMPLOYEE"]}	\N	535af2d90248e96c0e5554e46207cb554f59882f809dd0e4ffce08d500210022	2026-11-21 16:11:12.365
b7d2d169-7bc9-4145-b953-f3fca0223539	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	tharushasangeeth034@gmail.com	Tharusha Sangeeth	auth.login	auth	Session	tharushasangeeth034@gmail.com	::1	\N	{"roles": ["EMPLOYEE"]}	\N	7a84b2fbf734527b6164affc98d3976f56d6805a5450b003c4d7422bc92bfcc1	2026-11-21 16:11:16.245
4384876f-55ec-4b3e-b3c3-eaf2d3c626f1	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	auth.login	auth	Session	admin@serviceops.local	::1	\N	{"roles": ["SYSTEM_ADMINISTRATOR"]}	\N	bcba7f8c0a4cc016978f1b183da040273d7f1771d7e6533c98522cc79761b63f	2026-11-21 16:12:06.586
61a5423e-96f2-4c66-b937-d36b0924fa44	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	role.grant	users	User	employee_1795241855533@test.local	\N	{"roles": ["EMPLOYEE"]}	{"roles": ["IT_SUPPORT_AGENT"]}	\N	677775cebe3e3fd453dbd21ffbe4eb849935c5431430b2bcfe607780685e80cf	2026-11-21 16:13:33.884
edef6497-f90c-45e8-a57c-cdcc2acbf888	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	role.grant	users	User	employee_1795242339616@test.local	\N	{"roles": ["EMPLOYEE"]}	{"roles": ["IT_SUPPORT_AGENT"]}	\N	4a9298516e1d43c5072236eca5c3fb999109eb9cce3f66e0c7fdf53d1c252785	2026-11-21 16:13:38.497
0c4c7632-fa5f-497a-8e19-f8671432266d	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	role.grant	users	User	employee_1795242339616@test.local	\N	{"roles": ["IT_SUPPORT_AGENT"]}	{"roles": ["IT_MANAGER"]}	\N	995c2d47f3302d92db36037ad270f84a9c7c8905c2ffaecdc33741a2845c1c79	2026-11-21 16:13:41.563
8684a515-01e2-4915-ade5-b436d7a118bd	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	ticket.assign	tickets	Ticket	TKT-1043	\N	{}	{"assigneeId": "e49edb45-9c0a-489c-86ce-33fe16ab04fd", "assigneeName": "Tharusha Perera"}	\N	aca06d057a65bfcf26a3c3424e665b6999a6c9363468caa34ab3758970373a12	2026-11-21 16:14:25.853
2378ac44-360d-4899-82cb-7af55b5ba384	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	auth.login	auth	Session	admin@serviceops.local	::1	\N	{"roles": ["SYSTEM_ADMINISTRATOR"]}	\N	1ae91382fba61267ce85437578d6c6352551e59d5366e64c7e8a127fe3edc933	2026-11-21 16:15:13.75
ef4c8dda-1577-453f-9c9a-07d2c83d8d7a	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	auth.login	auth	Session	admin@serviceops.local	::1	\N	{"roles": ["SYSTEM_ADMINISTRATOR"]}	\N	04dd1d8ae320d2232f81d72081ba5a455091841f96ca05dcb97e8763cf1de50d	2026-11-21 16:16:01.079
5d463354-66c1-4584-acb5-249f9e1b7860	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	user.status	users	User	employee_1795242339616@test.local	\N	{"status": "ACTIVE"}	{"status": "SUSPENDED"}	\N	d488157440c1c61d1d74e877c1cc9e71f04ddb9be92a278c52d925fc3adb5ac3	2026-11-21 16:16:05.69
27b28333-5489-4b7f-ac46-dbd3a26be4f0	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	user.status	users	User	employee_1795241855533@test.local	\N	{"status": "ACTIVE"}	{"status": "SUSPENDED"}	\N	1db111e47641b005ccdcd88c63aa8c92d4e6770c9bb0e24be33ab25852535193	2026-11-21 16:16:08.535
8d59cf9b-d509-416f-a1ee-712914d86769	\N	employee_1795241855533@test.local	Tharusha Perera	auth.login	auth	Session	employee_1795241855533@test.local	::1	\N	{"roles": ["EMPLOYEE"]}	\N	bd0dfb082882a8d5a883ea85cc6c99cf788bfe366761a73313fb8ae5bc44d402	2026-11-21 06:17:36.355
b2e1481b-ac0c-4b6d-a75b-3b3fa2f95aba	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	auth.login	auth	Session	admin@serviceops.local	::1	\N	{"roles": ["SYSTEM_ADMINISTRATOR"]}	\N	5725ec398be9950d570f606037f23c36f8cb87056efd854ff1f94d9cdb6b2a17	2026-11-21 16:22:07.634
d6f7d360-3dee-4fe2-a792-f9143386f3d2	4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	System Administrator	role.grant	users	User	tharushasangeeth034@gmail.com	\N	{"roles": ["EMPLOYEE"]}	{"roles": ["IT_SUPPORT_AGENT"]}	\N	8efde60129fea0a27187b0df61d7642b3ff970a8137567ccbe99ac0277c37d41	2026-11-21 16:22:20.789
bdba6892-32b3-4738-baf7-9966ce585800	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	tharushasangeeth034@gmail.com	Tharusha Sangeeth	auth.login	auth	Session	tharushasangeeth034@gmail.com	::1	\N	{"roles": ["IT_SUPPORT_AGENT"]}	\N	e0acfdf568731dd0045162526a8e19b82ea8916734833e95d9cc1fca057d5568	2026-11-21 16:22:28.557
c60d09c9-4e1a-460a-9716-55f20758ebdb	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	tharushasangeeth034@gmail.com	Tharusha Sangeeth	ticket.status	tickets	Ticket	TKT-1043	\N	{"status": "ASSIGNED"}	{"status": "IN_PROGRESS"}	\N	5fd531f0e7ce285cd9d17fa37736219d56dc01916ec6974057390c040b9b0c1c	2026-11-21 16:22:54.268
916c36c1-9fe0-4c5c-b630-9a1f42d0e28b	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	tharushasangeeth034@gmail.com	Tharusha Sangeeth	ticket.status	tickets	Ticket	TKT-1043	\N	{"status": "IN_PROGRESS"}	{"status": "PENDING_CUSTOMER"}	\N	781f33a89ff2ee6e670e67aac3b980eecee327f522da632897dbbaeba7b428fe	2026-11-21 16:22:57.823
53a40767-a420-4407-ad65-e6f0012a3983	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	tharushasangeeth034@gmail.com	Tharusha Sangeeth	ticket.status	tickets	Ticket	TKT-1043	\N	{"status": "PENDING_CUSTOMER"}	{"status": "RESOLVED"}	\N	a16b7673763de1c3057a649342317033646d130faf2006c1a876f85afdb04d76	2026-11-21 16:23:02.147
1c5ab21e-b5c5-4147-ac94-aa65c2c87048	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	tharushasangeeth034@gmail.com	Tharusha Sangeeth	ticket.status	tickets	Ticket	TKT-1043	\N	{"status": "RESOLVED"}	{"status": "CLOSED"}	\N	6b74fc07f1fe98d41a37d48a570d16b7257be0e24603adc4a8739070da1f8d04	2026-11-21 16:23:04.223
ad301fcd-449b-4488-a46f-e24c2e928d60	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	tharushasangeeth034@gmail.com	Tharusha Sangeeth	ticket.assign	tickets	Ticket	TKT-1043	\N	{}	{"assigneeId": "e3961fb9-fcc8-4677-9153-a12f7fcb9aa5", "assigneeName": "Tharusha Sangeeth"}	\N	ff4bae454e93b637c6ddcc7025d7f5aba698afe9a801feb088ac41b3a313ef5a	2026-11-21 16:23:10.914
fc772729-9f34-4645-a72b-4285263eb540	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	tharushasangeeth034@gmail.com	Tharusha Sangeeth	auth.login	auth	Session	tharushasangeeth034@gmail.com	::1	\N	{"roles": ["IT_SUPPORT_AGENT"]}	\N	9c894631c4b6e47953d09249ff0eef2332735a9387132b8b8984337f57227eb6	2026-11-21 18:13:34.977
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, code, description, icon, created_at, default_priority, is_active, subcategories) FROM stdin;
1d6d6f34-5374-42f4-a4f2-8b8f0b534271	QA Facilities 2f01e5	QA2F01	Access badges & physical room equipment	📁	2026-11-12 07:56:20.78	HIGH_P2	f	{Badge,AV}
80c5166f-0f2c-4068-a8e2-a41dde341c2d	QA Facilities 8021fc	QA8021	Access badges & physical room equipment	📁	2026-11-12 08:01:51.611	HIGH_P2	f	{Badge,AV}
f44916b3-43b1-4069-be99-e00cc1fc5b44	QA Facilities de44c4	QADE44	Access badges & physical room equipment	📁	2026-11-12 16:01:01.998	HIGH_P2	f	{Badge,AV}
de191d92-e5e3-4bc4-8420-6932161f2582	Hardware	HW	Laptops, docks, screens, peripherals	💻	2026-11-07 12:40:21.886	MEDIUM_P3	t	{}
01d84992-dea0-4e1d-ad44-900bc41cf4c6	Access	ACC	Accounts, mail, VPN, domain access	🔑	2026-11-07 12:40:21.892	MEDIUM_P3	t	{}
ed83958f-80f4-405e-8867-b1cbe6c1f9cd	Software	SW	Enterprise installs, licenses, cloud apps	📦	2026-11-07 12:40:21.894	MEDIUM_P3	t	{}
5c8be5d7-3540-45e6-a710-06e14c6ec23d	Network	NET	Office Wi-Fi, Ethernet, connectivity	🌐	2026-11-07 12:40:21.897	MEDIUM_P3	t	{}
944d80b2-177c-45d8-967e-beaf30e88675	Workplace	WRK	Printers, AV rooms, phones, physical hub	🏢	2026-11-07 12:40:21.9	MEDIUM_P3	t	{}
c23e2d7d-edd3-4adb-89ab-84d81ad3a323	Security	SEC	Phishing reports, security badges, MFA tokens	🔒	2026-11-07 12:40:21.901	MEDIUM_P3	t	{}
\.


--
-- Data for Name: incident_updates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.incident_updates (id, incident_id, author_id, message, created_at) FROM stdin;
\.


--
-- Data for Name: incidents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.incidents (id, incident_number, title, description, severity, status, impact_scope, root_cause, workaround, reporter_id, commander_id, resolved_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: knowledge_articles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_articles (id, slug, title, summary, content, category_id, status, author_id, read_minutes, helpful_count, views_count, tags, published_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notification_deliveries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_deliveries (id, notification_id, channel, status, attempts, last_error, sent_at, created_at, updated_at) FROM stdin;
31a1d492-9d87-4a6f-a33f-b1a33d4c450b	21a7629c-a0b3-4580-ab49-7ee971420162	IN_APP	SENT	1	\N	2026-11-21 07:50:05.306	2026-11-21 07:50:05.307	2026-11-21 07:50:05.307
01b00bc6-778b-4704-87c6-13d1659e70f8	21a7629c-a0b3-4580-ab49-7ee971420162	EMAIL	SENT	1	\N	2026-11-21 07:50:06.362	2026-11-21 07:50:05.307	2026-11-21 07:50:06.363
d242e50a-78ff-4f44-bcd5-4a3b99ad9669	5b7168c5-0aba-48d0-9f52-a0cf1696666c	IN_APP	SENT	1	\N	2026-11-21 16:12:34.194	2026-11-21 16:12:34.195	2026-11-21 16:12:34.195
4c5797fd-3611-4959-91c6-01e223929c66	5b7168c5-0aba-48d0-9f52-a0cf1696666c	EMAIL	SENT	1	\N	2026-11-21 16:12:37.183	2026-11-21 16:12:34.195	2026-11-21 16:12:37.184
3f85e973-5061-45df-b0ef-3f3a5b2e060a	544db2e4-ccb5-468a-a274-9326a784e14c	IN_APP	SENT	1	\N	2026-11-21 16:14:25.854	2026-11-21 16:14:25.856	2026-11-21 16:14:25.856
45700b05-f0bf-43e7-8fc3-9cca870dee86	544db2e4-ccb5-468a-a274-9326a784e14c	EMAIL	SENT	1	\N	2026-11-21 16:14:28.655	2026-11-21 16:14:25.856	2026-11-21 16:14:28.656
7cc0d2b7-dbc3-4305-896f-7551ec003be1	a10f3db0-5cfc-4a6b-8f04-112870903535	IN_APP	SENT	1	\N	2026-11-21 16:23:10.916	2026-11-21 16:23:10.918	2026-11-21 16:23:10.918
8f7594f7-afa0-43a3-af71-086c25dd9882	a10f3db0-5cfc-4a6b-8f04-112870903535	EMAIL	SENT	1	\N	2026-11-21 16:23:12.446	2026-11-21 16:23:10.918	2026-11-21 16:23:12.448
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, recipient_id, type, title, message, entity_type, entity_id, link_url, is_read, read_at, created_at) FROM stdin;
21a7629c-a0b3-4580-ab49-7ee971420162	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	TICKET_CREATED	TKT-1043 submitted	We received "Network failure" (MEDIUM_P3). An IT support specialist will triage your request shortly.	TICKET	674e5115-eb92-4ff0-9a09-8ddc82d85b3e	/dashboard?ticket=674e5115-eb92-4ff0-9a09-8ddc82d85b3e	t	2026-11-21 16:11:55.616	2026-11-21 07:50:05.307
544db2e4-ccb5-468a-a274-9326a784e14c	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	TICKET_UPDATED	TKT-1043 assigned to support	Your request "Network failure" is now with Tharusha Perera.	TICKET	674e5115-eb92-4ff0-9a09-8ddc82d85b3e	/dashboard?ticket=674e5115-eb92-4ff0-9a09-8ddc82d85b3e	t	2026-11-21 16:22:37.738	2026-11-21 16:14:25.856
5b7168c5-0aba-48d0-9f52-a0cf1696666c	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	TICKET_COMMENTED	TKT-1043 was updated	System Administrator replied on "Network failure".	TICKET	674e5115-eb92-4ff0-9a09-8ddc82d85b3e	/dashboard?ticket=674e5115-eb92-4ff0-9a09-8ddc82d85b3e	t	2026-11-21 16:22:41.179	2026-11-21 16:12:34.195
a10f3db0-5cfc-4a6b-8f04-112870903535	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	TICKET_ASSIGNED	You were assigned TKT-1043	Assigned by Tharusha Sangeeth: "Network failure" (MEDIUM_P3).	TICKET	674e5115-eb92-4ff0-9a09-8ddc82d85b3e	/dashboard?ticket=674e5115-eb92-4ff0-9a09-8ddc82d85b3e	t	2026-11-21 18:14:11.27	2026-11-21 16:23:10.918
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (id, token_hash, user_id, expires_at, used_at, created_at) FROM stdin;
c93a4b90-e138-435e-9c54-9e65271935c3	2c5fadd9ad17f6fe7e6ed5f43d1cc962f1037f8ace682d691451a7839e2734a9	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	2026-11-21 08:20:39.298	2026-11-21 13:05:16.808	2026-11-21 07:50:39.302
40e0d050-17f8-4ef9-9db7-18f03e862a90	70891a6fc8f5e286e273027b17fb8f4f76d824a32b041acc5d4d4527cdbef887	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	2026-11-21 13:35:16.807	2026-11-21 13:07:28.377	2026-11-21 13:05:16.813
038ae15f-818c-4dfd-a6fc-957c6ec4d509	5eee6aea3d767859cbeeb33974feaaaa75491e3eaa640f191346d4871dee1ef1	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	2026-11-21 13:37:28.377	2026-11-21 15:43:45.443	2026-11-21 13:07:28.38
5f800d73-a363-4e64-a818-58ece1066678	5119916f272c416d78ec8477b8c9c44461380f4863db04e9c6e5b74fc54b6a6f	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	2026-11-21 16:13:45.443	2026-11-21 15:45:33.398	2026-11-21 15:43:45.445
b5f6a5de-55c1-47e3-8131-f1765cb68ebf	12d415712b36c8618e828263e2f06cb3c8e5a35f0cd35784a3ab62f408ec8211	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	2026-11-21 16:15:33.398	2026-11-21 15:59:46.764	2026-11-21 15:45:33.4
8d8e807d-3300-4097-a732-7aa8aced6086	1dae7df33f6867130146edb18ff660ac5ef3d3d832eae4176a502243dfdead34	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	2026-11-21 16:29:46.763	2026-11-21 16:01:28.471	2026-11-21 15:59:46.767
e1bf0df6-2939-4ab3-b99e-e1d1107be21d	21814ec591f512581defd1ed534dd2a2f844b35a7152c310185b346518e6605a	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	2026-11-21 16:31:28.471	2026-11-21 16:23:57.724	2026-11-21 16:01:28.474
369af069-3993-48d0-bd17-4b73a8525b76	b90e4499e7185f4955e73aa655f2dca2ee8e9d4785e412763e087c77e4d68d15	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	2026-11-21 16:53:57.724	2026-11-21 18:07:46.015	2026-11-21 16:23:57.726
5de24661-3238-40b5-acfe-6272accd7082	5ccc50e618bc0b25af2df3f15cb048fdd6202f4ec0ab9f2b334a17d5b02a8586	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	2026-11-21 18:37:46.015	\N	2026-11-21 18:07:46.019
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, name, module, description, created_at) FROM stdin;
b99dc1cd-9d76-4fdc-b2eb-f5512dd15691	ticket:create	tickets	Create new service requests and incidents	2026-11-06 20:43:52.486
69d1ae14-4bfe-41ab-a949-432933d7e8a2	ticket:read_own	tickets	View own submitted tickets	2026-11-06 20:43:52.49
eb4ce08d-f5ae-4f4b-aa68-57dcb23aa3a3	ticket:read_assigned	tickets	View tickets assigned to current agent or team	2026-11-06 20:43:52.491
c2818e4a-7249-4c2c-88a7-fc7f245049a4	ticket:read_all	tickets	View all tickets in the system	2026-11-06 20:43:52.492
96095abf-77a3-4452-889d-861a1d8e03cc	ticket:update	tickets	Update status, priority, and metadata of tickets	2026-11-06 20:43:52.493
90bf3f97-7dcc-430f-9c67-cb9d186c2323	ticket:assign	tickets	Assign or reassign tickets to agents	2026-11-06 20:43:52.494
d6db7287-3c8d-4bd2-8434-8987cb32c7c4	ticket:internal_note	tickets	Create and view agent-only internal notes	2026-11-06 20:43:52.495
ecaad600-bdd0-42ce-8614-57f6d5116612	ticket:delete	tickets	Soft delete tickets	2026-11-06 20:43:52.496
da3eaeb3-a359-4c54-8fad-f25f4e831341	incident:declare	incidents	Declare major incidents (P1/P2)	2026-11-06 20:43:52.497
27d66c53-6be3-4b09-80ec-7177feef907f	incident:read	incidents	View incident registry and timeline	2026-11-06 20:43:52.497
45e16e4f-c504-4412-a6b8-9b9578858384	incident:update	incidents	Update incident status and war room	2026-11-06 20:43:52.498
7569105a-6351-43f6-a3f5-076ff446852d	sla:view	sla	View SLA policies and compliance metrics	2026-11-06 20:43:52.499
39d6cb0c-a853-4859-b43c-b77a7e5e84be	sla:manage	sla	Configure SLA thresholds, escalation tiers, and business hours	2026-11-06 20:43:52.499
fe3bf47d-d00c-4d60-a307-1605e0007bc2	kb:read	knowledge	Browse and search public knowledge articles	2026-11-06 20:43:52.5
6eacbc02-6c43-4567-aa75-1731b16e8314	kb:manage	knowledge	Author, publish, and archive knowledge articles	2026-11-06 20:43:52.5
4bd9c61f-bea1-418a-8ed4-fe1a0a0d4687	asset:read	assets	View IT asset inventory	2026-11-06 20:43:52.501
220ce671-2147-46b0-885e-9aefb1c8f0ed	asset:manage	assets	Create, update, and link IT assets	2026-11-06 20:43:52.501
de0a1dd9-24a9-40f9-97bb-e8c1ab19cd24	user:manage	admin	Create, edit, lock, and assign roles to users	2026-11-06 20:43:52.502
9f08a297-d525-42a8-becb-ced48f346497	audit:read	admin	Inspect tamper-evident system audit trail	2026-11-06 20:43:52.502
65b77d0a-e277-4e4d-b5fc-8f7f801c5e6c	reports:view	reports	Generate and export ITSM analytics and reports	2026-11-06 20:43:52.503
\.


--
-- Data for Name: platform_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platform_settings (key, category, value, updated_by_id, updated_at) FROM stdin;
maxFailedLogins	security	5	4c175c26-6b57-42bb-baeb-aca248fc1b9c	2026-11-12 16:01:02.08
lastBackupSummary	backups	PostgreSQL logical snapshot verified: 7 users, 8 tickets, 4 incidents, 10 audit rows	4c175c26-6b57-42bb-baeb-aca248fc1b9c	2026-11-12 16:01:02.176
lastBackupAt	backups	2026-11-12T16:01:02.174Z	4c175c26-6b57-42bb-baeb-aca248fc1b9c	2026-11-12 16:01:02.176
organization_name	general	Northwind Internal IT	\N	2026-11-15 06:30:18.004
timezone	general	Asia/Colombo	4c175c26-6b57-42bb-baeb-aca248fc1b9c	2026-11-15 06:30:18.01
business_hours	general	Mon-Fri 08:00-18:00	\N	2026-11-15 06:30:18.012
ticket_retention_months	policy	24	\N	2026-11-15 06:30:18.013
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, token_hash, user_id, family, is_revoked, expires_at, created_at, user_agent, ip_address) FROM stdin;
a3155891-0f1a-406f-8721-43b7ccb269f8	17269eba29d88ec0cc918b24667a4e4085599872d82420673fe124cba2311183	4c175c26-6b57-42bb-baeb-aca248fc1b9c	e08d3325-e999-4db4-8f7b-8466eb632299	f	2026-11-22 06:43:49.829	2026-11-15 06:43:49.83	\N	::ffff:127.0.0.1
f26401d6-04aa-432d-95e4-52e566691b00	b6c6d1a32e600dc5176b15eb8031460645f95ec6e0471079a1c29438c34f0504	4c175c26-6b57-42bb-baeb-aca248fc1b9c	8d24bf79-daa7-4efd-ad8b-0c4de9397cc8	t	2026-11-22 19:10:34.744	2026-11-15 19:10:34.746	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	::1
7ede2467-c615-43eb-9e94-ccf8947f864c	d84506f4ba65bd88d9badaa52420f1b3258bf94d6aa539333797929f175b60ab	4c175c26-6b57-42bb-baeb-aca248fc1b9c	6c5fe478-39ba-486b-acfc-3e0d3cb62be4	t	2026-11-22 08:01:16.262	2026-11-15 08:01:16.264	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	::1
6acb17a1-ca7c-44db-b59b-ac4c5482ac5c	03279e92948ad7153d73491e96b229003440724cc7b6e983320ee357cd86b7c5	4c175c26-6b57-42bb-baeb-aca248fc1b9c	dc6de3af-b700-4c5f-9e3b-b1ce7b8d4933	f	2026-11-23 08:14:53.225	2026-11-16 08:14:53.227	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	::1
6d01ac3b-e6be-4ed1-862f-18d24bbe72b9	a3ddcb81f0a94276e97795c199ed7fac26e755c3dc45503804f292e54770f2ab	4c175c26-6b57-42bb-baeb-aca248fc1b9c	4914cb75-235a-42e4-b192-13ec7d4ec540	f	2026-11-22 09:17:02.117	2026-11-15 09:17:02.119	\N	::ffff:127.0.0.1
91546d0f-cd79-448b-b73d-bb1a66e08b1c	1db1d57537843d22abf1fd83df4907ce2b9450c48c6a4f3fee496dd9bf21d7f1	4c175c26-6b57-42bb-baeb-aca248fc1b9c	bac13b2e-62c1-423e-ae4f-4b563418af06	f	2026-11-22 13:04:55.994	2026-11-15 13:04:55.995	\N	::ffff:127.0.0.1
3c314e78-1a88-4362-bc75-c28e3e4fb803	08853c859a3444b1f77c0451b6fd1f2fa5da29e5138549211a5bb2a5b21dd40f	4c175c26-6b57-42bb-baeb-aca248fc1b9c	28fe86c0-3281-490b-8b47-2389ba50dc15	t	2026-11-23 08:14:56.145	2026-11-16 08:14:56.147	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	::1
eaf6220c-7910-477b-9303-c3c71a6c951b	a3609d029f92288acb53f9643f2ef5b931450c08e1d5cb21aef1affe66cd3333	4c175c26-6b57-42bb-baeb-aca248fc1b9c	4c060cda-3024-48a2-9fe9-1716000f5c40	t	2026-11-22 17:21:52.954	2026-11-15 17:21:52.955	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	::1
afda3e96-6acf-4996-bf4a-163c763421f6	5fc63a28d66d921582f7494ff3c044ebbada1448548a91ac794cd5be81c99b78	4c175c26-6b57-42bb-baeb-aca248fc1b9c	4c060cda-3024-48a2-9fe9-1716000f5c40	f	2026-11-22 19:07:24.841	2026-11-15 19:07:24.842	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	::1
a4e0e559-9e21-4fef-8e5e-de80751c0d2a	8943ce133449db55a4329f62260f84074b0d21cb4366e0c731056c7d8cc353fb	4c175c26-6b57-42bb-baeb-aca248fc1b9c	4c060cda-3024-48a2-9fe9-1716000f5c40	t	2026-11-22 19:07:24.839	2026-11-15 19:07:24.842	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	::1
a6ed9cb1-c5d1-461e-9b55-511df32677e6	febe41341ffbb7de667ffa320a6beb3cb987c1dfb508a5e264b04f20191158d5	4c175c26-6b57-42bb-baeb-aca248fc1b9c	530c458a-d9ef-4f88-b1ea-83416526d82c	t	2026-11-24 19:40:31.499	2026-11-17 19:40:31.501	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	::1
edb55757-9a8d-404d-b4c3-4029b61c7eff	07e66e563e588fba64726b7005aeb59b00f6175db8ae5d90993bcc2cfa27fa02	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	938b5ec2-02b0-40f8-bf67-5e1075ef85d9	t	2026-11-24 19:41:52.808	2026-11-17 19:41:52.809	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	::1
b2ad95b0-f94b-4756-a9a9-0edcd5624ca3	b1c55113548519b3c2deb29de601b9994349dab0278265284600880efa8550af	4c175c26-6b57-42bb-baeb-aca248fc1b9c	f7965352-6f7b-4e7c-8266-1d1b25f57710	f	2026-11-28 06:17:35.47	2026-11-21 06:17:35.473	node	::1
5d6d6e5b-b631-4da1-a38e-628436455330	d4ba5e5523d582422c82790a1dba3178d1e33598924f3baf28266f66f92bf22a	4c175c26-6b57-42bb-baeb-aca248fc1b9c	bef5fbbe-f5fb-440b-865c-7c47dd1542bf	f	2026-11-28 06:25:39.594	2026-11-21 06:25:39.595	node	::1
a887086e-4f3b-46f8-a102-99769e745356	43e54630aa59d093c6681eead21896abba7aee573f1f63ef1886fa069cac87e8	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	ba2bcad2-0fdf-49ce-8850-35890e190545	t	2026-11-28 07:49:21.757	2026-11-21 07:49:21.758	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36	::1
87c82122-ebc2-42d0-a9ea-8a38d7e31362	eaed90ff22b9d0c32b84b276e50a170b0e92b9057680c0cdf7318bb5cfe4d22e	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	01af7ef3-c472-4cb5-8645-d3736f2c82c0	f	2026-11-28 16:11:12.348	2026-11-21 16:11:12.35	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36	::1
68f27811-9c8a-446e-97dc-2f3509fde4cd	fb66135d95fc4525da3f28562aea05cdc8e1d392e3cc6809987f18f9937c8cfe	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	a35a1885-1ff0-47e0-a8d9-e1d1985f118b	t	2026-11-28 16:11:16.24	2026-11-21 16:11:16.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36	::1
b9ee50b3-5f90-4613-bb84-efb415ba0a6e	989d146d0b294d7e11d7b5b76262fa3701c28eb19c326338353f1bf78b15d1ce	4c175c26-6b57-42bb-baeb-aca248fc1b9c	183fd6f3-1ee1-4bb7-83dc-16ff857ec08a	t	2026-11-28 16:12:06.572	2026-11-21 16:12:06.574	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36	::1
19938b9a-a212-40f3-99c5-f4ab6140e004	c7cefe5b067ed8818498709f3aed39f87bbec1b86672ef253ae6b930cd504f16	4c175c26-6b57-42bb-baeb-aca248fc1b9c	b062bb70-cb87-4db8-9df3-860e9918cd73	t	2026-11-28 16:15:13.742	2026-11-21 16:15:13.744	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36	::1
29435b32-3ad1-458d-bad6-579e824dcd6e	58b8b548c00f366f1771e65d184238ff225ee8ff63198812b27f9257d5d46401	4c175c26-6b57-42bb-baeb-aca248fc1b9c	4c0b69ff-0631-4a65-8365-9abc0b839089	t	2026-11-28 16:16:01.075	2026-11-21 16:16:01.076	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36	::1
a8fe76d7-ccdc-4836-bbbb-b13b44df2aa8	f3c239e3d71383edccd2a1e6e20828692a1cd35a76f5b22a1a84511d1ae17c5b	4c175c26-6b57-42bb-baeb-aca248fc1b9c	f3923d46-3beb-423d-a05b-951bd667ddc0	t	2026-11-28 16:22:07.624	2026-11-21 16:22:07.625	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36	::1
1cfdf2e2-d68b-4783-9c3f-fd71ad179308	983e9029ff9175b5cb43c641b15092a6ce40cbf1fc49d480e90953ea74c68bbb	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	e4187b93-0608-45c5-b81b-4363da362bdc	t	2026-11-28 16:22:28.546	2026-11-21 16:22:28.547	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36	::1
a96ccda0-3c37-4cc9-8093-5d176cfec295	4a6fd8d252c8afd6171fb2280f9f10d3eb0905230fd06089d4b49d43e03fd016	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	339baa2b-487a-400f-b483-bd5d742781b0	t	2026-11-28 18:13:34.949	2026-11-21 18:13:34.951	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36	::1
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (role_id, permission_id, assigned_at) FROM stdin;
98e2fe65-5fd1-48af-8507-73a6f9016aeb	b99dc1cd-9d76-4fdc-b2eb-f5512dd15691	2026-11-06 20:43:52.504
98e2fe65-5fd1-48af-8507-73a6f9016aeb	69d1ae14-4bfe-41ab-a949-432933d7e8a2	2026-11-06 20:43:52.511
98e2fe65-5fd1-48af-8507-73a6f9016aeb	eb4ce08d-f5ae-4f4b-aa68-57dcb23aa3a3	2026-11-06 20:43:52.513
98e2fe65-5fd1-48af-8507-73a6f9016aeb	c2818e4a-7249-4c2c-88a7-fc7f245049a4	2026-11-06 20:43:52.514
98e2fe65-5fd1-48af-8507-73a6f9016aeb	96095abf-77a3-4452-889d-861a1d8e03cc	2026-11-06 20:43:52.515
98e2fe65-5fd1-48af-8507-73a6f9016aeb	90bf3f97-7dcc-430f-9c67-cb9d186c2323	2026-11-06 20:43:52.516
98e2fe65-5fd1-48af-8507-73a6f9016aeb	d6db7287-3c8d-4bd2-8434-8987cb32c7c4	2026-11-06 20:43:52.518
98e2fe65-5fd1-48af-8507-73a6f9016aeb	ecaad600-bdd0-42ce-8614-57f6d5116612	2026-11-06 20:43:52.519
98e2fe65-5fd1-48af-8507-73a6f9016aeb	da3eaeb3-a359-4c54-8fad-f25f4e831341	2026-11-06 20:43:52.52
98e2fe65-5fd1-48af-8507-73a6f9016aeb	27d66c53-6be3-4b09-80ec-7177feef907f	2026-11-06 20:43:52.521
98e2fe65-5fd1-48af-8507-73a6f9016aeb	45e16e4f-c504-4412-a6b8-9b9578858384	2026-11-06 20:43:52.522
98e2fe65-5fd1-48af-8507-73a6f9016aeb	7569105a-6351-43f6-a3f5-076ff446852d	2026-11-06 20:43:52.523
98e2fe65-5fd1-48af-8507-73a6f9016aeb	39d6cb0c-a853-4859-b43c-b77a7e5e84be	2026-11-06 20:43:52.525
98e2fe65-5fd1-48af-8507-73a6f9016aeb	fe3bf47d-d00c-4d60-a307-1605e0007bc2	2026-11-06 20:43:52.526
98e2fe65-5fd1-48af-8507-73a6f9016aeb	6eacbc02-6c43-4567-aa75-1731b16e8314	2026-11-06 20:43:52.527
98e2fe65-5fd1-48af-8507-73a6f9016aeb	4bd9c61f-bea1-418a-8ed4-fe1a0a0d4687	2026-11-06 20:43:52.528
98e2fe65-5fd1-48af-8507-73a6f9016aeb	220ce671-2147-46b0-885e-9aefb1c8f0ed	2026-11-06 20:43:52.529
98e2fe65-5fd1-48af-8507-73a6f9016aeb	de0a1dd9-24a9-40f9-97bb-e8c1ab19cd24	2026-11-06 20:43:52.53
98e2fe65-5fd1-48af-8507-73a6f9016aeb	9f08a297-d525-42a8-becb-ced48f346497	2026-11-06 20:43:52.531
98e2fe65-5fd1-48af-8507-73a6f9016aeb	65b77d0a-e277-4e4d-b5fc-8f7f801c5e6c	2026-11-06 20:43:52.532
7ff6dc0f-6d8b-493d-85b7-942c3329ee60	b99dc1cd-9d76-4fdc-b2eb-f5512dd15691	2026-11-06 20:43:52.533
7ff6dc0f-6d8b-493d-85b7-942c3329ee60	c2818e4a-7249-4c2c-88a7-fc7f245049a4	2026-11-06 20:43:52.535
7ff6dc0f-6d8b-493d-85b7-942c3329ee60	96095abf-77a3-4452-889d-861a1d8e03cc	2026-11-06 20:43:52.536
7ff6dc0f-6d8b-493d-85b7-942c3329ee60	90bf3f97-7dcc-430f-9c67-cb9d186c2323	2026-11-06 20:43:52.537
7ff6dc0f-6d8b-493d-85b7-942c3329ee60	d6db7287-3c8d-4bd2-8434-8987cb32c7c4	2026-11-06 20:43:52.538
7ff6dc0f-6d8b-493d-85b7-942c3329ee60	da3eaeb3-a359-4c54-8fad-f25f4e831341	2026-11-06 20:43:52.539
7ff6dc0f-6d8b-493d-85b7-942c3329ee60	27d66c53-6be3-4b09-80ec-7177feef907f	2026-11-06 20:43:52.54
7ff6dc0f-6d8b-493d-85b7-942c3329ee60	45e16e4f-c504-4412-a6b8-9b9578858384	2026-11-06 20:43:52.541
7ff6dc0f-6d8b-493d-85b7-942c3329ee60	7569105a-6351-43f6-a3f5-076ff446852d	2026-11-06 20:43:52.543
7ff6dc0f-6d8b-493d-85b7-942c3329ee60	39d6cb0c-a853-4859-b43c-b77a7e5e84be	2026-11-06 20:43:52.544
7ff6dc0f-6d8b-493d-85b7-942c3329ee60	fe3bf47d-d00c-4d60-a307-1605e0007bc2	2026-11-06 20:43:52.545
7ff6dc0f-6d8b-493d-85b7-942c3329ee60	6eacbc02-6c43-4567-aa75-1731b16e8314	2026-11-06 20:43:52.546
7ff6dc0f-6d8b-493d-85b7-942c3329ee60	4bd9c61f-bea1-418a-8ed4-fe1a0a0d4687	2026-11-06 20:43:52.547
7ff6dc0f-6d8b-493d-85b7-942c3329ee60	220ce671-2147-46b0-885e-9aefb1c8f0ed	2026-11-06 20:43:52.548
7ff6dc0f-6d8b-493d-85b7-942c3329ee60	65b77d0a-e277-4e4d-b5fc-8f7f801c5e6c	2026-11-06 20:43:52.549
7ff6dc0f-6d8b-493d-85b7-942c3329ee60	9f08a297-d525-42a8-becb-ced48f346497	2026-11-06 20:43:52.55
bcba84ec-c1f8-4c91-8ca9-51edde8d18b2	b99dc1cd-9d76-4fdc-b2eb-f5512dd15691	2026-11-06 20:43:52.552
bcba84ec-c1f8-4c91-8ca9-51edde8d18b2	69d1ae14-4bfe-41ab-a949-432933d7e8a2	2026-11-06 20:43:52.553
bcba84ec-c1f8-4c91-8ca9-51edde8d18b2	eb4ce08d-f5ae-4f4b-aa68-57dcb23aa3a3	2026-11-06 20:43:52.554
bcba84ec-c1f8-4c91-8ca9-51edde8d18b2	c2818e4a-7249-4c2c-88a7-fc7f245049a4	2026-11-06 20:43:52.555
bcba84ec-c1f8-4c91-8ca9-51edde8d18b2	96095abf-77a3-4452-889d-861a1d8e03cc	2026-11-06 20:43:52.557
bcba84ec-c1f8-4c91-8ca9-51edde8d18b2	90bf3f97-7dcc-430f-9c67-cb9d186c2323	2026-11-06 20:43:52.558
bcba84ec-c1f8-4c91-8ca9-51edde8d18b2	d6db7287-3c8d-4bd2-8434-8987cb32c7c4	2026-11-06 20:43:52.559
bcba84ec-c1f8-4c91-8ca9-51edde8d18b2	da3eaeb3-a359-4c54-8fad-f25f4e831341	2026-11-06 20:43:52.561
bcba84ec-c1f8-4c91-8ca9-51edde8d18b2	27d66c53-6be3-4b09-80ec-7177feef907f	2026-11-06 20:43:52.563
bcba84ec-c1f8-4c91-8ca9-51edde8d18b2	45e16e4f-c504-4412-a6b8-9b9578858384	2026-11-06 20:43:52.564
bcba84ec-c1f8-4c91-8ca9-51edde8d18b2	7569105a-6351-43f6-a3f5-076ff446852d	2026-11-06 20:43:52.565
bcba84ec-c1f8-4c91-8ca9-51edde8d18b2	fe3bf47d-d00c-4d60-a307-1605e0007bc2	2026-11-06 20:43:52.567
bcba84ec-c1f8-4c91-8ca9-51edde8d18b2	6eacbc02-6c43-4567-aa75-1731b16e8314	2026-11-06 20:43:52.568
bcba84ec-c1f8-4c91-8ca9-51edde8d18b2	4bd9c61f-bea1-418a-8ed4-fe1a0a0d4687	2026-11-06 20:43:52.569
3538b957-295b-4083-ac7b-df1d0f3c67de	b99dc1cd-9d76-4fdc-b2eb-f5512dd15691	2026-11-06 20:43:52.571
3538b957-295b-4083-ac7b-df1d0f3c67de	69d1ae14-4bfe-41ab-a949-432933d7e8a2	2026-11-06 20:43:52.572
3538b957-295b-4083-ac7b-df1d0f3c67de	fe3bf47d-d00c-4d60-a307-1605e0007bc2	2026-11-06 20:43:52.573
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, display_name, description, is_system, created_at, updated_at) FROM stdin;
98e2fe65-5fd1-48af-8507-73a6f9016aeb	SYSTEM_ADMINISTRATOR	System Administrator	Full administrative access to platform configuration, users, and audit logs.	t	2026-11-06 20:43:52.458	2026-11-15 06:30:17.406
7ff6dc0f-6d8b-493d-85b7-942c3329ee60	IT_MANAGER	IT Manager	Supervises ticket queues, SLA compliance, escalations, reporting, and agent allocations.	t	2026-11-06 20:43:52.481	2026-11-15 06:30:17.413
bcba84ec-c1f8-4c91-8ca9-51edde8d18b2	IT_SUPPORT_AGENT	IT Support Agent	Handles assigned service tickets, manages incidents, and collaborates internally.	t	2026-11-06 20:43:52.483	2026-11-15 06:30:17.418
3538b957-295b-4083-ac7b-df1d0f3c67de	EMPLOYEE	Employee / Requester	Submits service requests, tracks status, and views self-service knowledge articles.	t	2026-11-06 20:43:52.485	2026-11-15 06:30:17.42
\.


--
-- Data for Name: sla_policies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sla_policies (id, name, priority, description, response_target_minutes, resolution_target_minutes, business_hours_only, warning_threshold_pct, business_start_hour, business_end_hour, created_at, updated_at) FROM stdin;
775f13e1-e537-4d92-befe-b81921c5a46b	P1 - Critical Priority 24x7 Emergency Policy	CRITICAL_P1	Catastrophic organization-wide impediment. Uninterrupted 24x7 coverage.	15	120	f	75	8	18	2026-11-07 13:19:24.339	2026-11-15 06:30:17.993
2817196b-01f7-411c-a59b-b9b14102cd09	P2 - High Priority Business Hours Policy	HIGH_P2	Major operational impediment with no workaround. Core business hours coverage.	60	480	t	75	8	18	2026-11-07 13:19:24.346	2026-11-15 06:30:17.998
d59badc6-c98c-420c-b008-4848c04add43	P3 - Standard Service Request Policy	MEDIUM_P3	Standard business service requests and localized issues with workarounds.	240	1440	t	75	8	18	2026-11-07 13:19:24.347	2026-11-15 06:30:18
130dff34-c8b1-4ce5-8c16-1f68a77ee947	P4 - General Inquiries & Scheduled Changes Policy	LOW_P4	Low-priority inquiries, general assistance, and planned changes.	480	4320	t	75	8	18	2026-11-07 13:19:24.348	2026-11-15 06:30:18.002
\.


--
-- Data for Name: ticket_activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_activity_logs (id, ticket_id, actor_id, action, old_value, new_value, details, created_at) FROM stdin;
d482d17f-9b58-4053-a80b-531691bfbd08	674e5115-eb92-4ff0-9a09-8ddc82d85b3e	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	CREATED	\N	NEW	Ticket submitted with priority MEDIUM_P3	2026-11-21 07:50:05.272
0154b159-140f-4d5d-8376-cf0e5d78e860	674e5115-eb92-4ff0-9a09-8ddc82d85b3e	4c175c26-6b57-42bb-baeb-aca248fc1b9c	ASSIGNED	Unassigned	Tharusha Perera	Assigned to Tharusha Perera	2026-11-21 16:14:25.841
dda4b6db-b394-40b8-b7e8-af5f55a1f7fb	674e5115-eb92-4ff0-9a09-8ddc82d85b3e	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	STATUS_CHANGED	ASSIGNED	IN_PROGRESS	Status updated from ASSIGNED to IN_PROGRESS	2026-11-21 16:22:54.257
f9642c30-2d94-4642-9c0c-0e7e9be7afc7	674e5115-eb92-4ff0-9a09-8ddc82d85b3e	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	STATUS_CHANGED	IN_PROGRESS	PENDING_CUSTOMER	Status updated from IN_PROGRESS to PENDING_CUSTOMER	2026-11-21 16:22:57.808
8a702d02-573c-41f5-8035-1a2f33ec7bcf	674e5115-eb92-4ff0-9a09-8ddc82d85b3e	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	STATUS_CHANGED	PENDING_CUSTOMER	RESOLVED	Issue verified and resolved.	2026-11-21 16:23:02.136
6eac5d85-079d-44bf-8b04-e6242fe22bac	674e5115-eb92-4ff0-9a09-8ddc82d85b3e	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	STATUS_CHANGED	RESOLVED	CLOSED	Status updated from RESOLVED to CLOSED	2026-11-21 16:23:04.217
3e519a6e-fd64-4e84-9744-46cf5a318001	674e5115-eb92-4ff0-9a09-8ddc82d85b3e	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	ASSIGNED	Unassigned	Tharusha Sangeeth	Assigned to Tharusha Sangeeth	2026-11-21 16:23:10.91
\.


--
-- Data for Name: ticket_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_attachments (id, ticket_id, uploader_id, file_name, file_size, mime_type, storage_key, created_at) FROM stdin;
\.


--
-- Data for Name: ticket_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_comments (id, ticket_id, author_id, type, content, created_at, updated_at) FROM stdin;
38def046-44f3-4009-88ce-b4b7dfdf2ea5	674e5115-eb92-4ff0-9a09-8ddc82d85b3e	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	PUBLIC	why not update for this issue\n	2026-11-21 16:11:45.458	2026-11-21 16:11:45.458
be739bc0-41be-453b-8477-4d383058a982	674e5115-eb92-4ff0-9a09-8ddc82d85b3e	4c175c26-6b57-42bb-baeb-aca248fc1b9c	PUBLIC	okay we see	2026-11-21 16:12:34.185	2026-11-21 16:12:34.185
\.


--
-- Data for Name: ticket_sla_snapshots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_sla_snapshots (id, ticket_id, policy_id, response_target_minutes, resolution_target_minutes, response_due_at, resolution_due_at, first_response_at, resolved_at, is_response_met, is_resolution_met, paused_at, total_paused_minutes, status, created_at, updated_at, breach_notified_at, warning_notified_at) FROM stdin;
8f054404-46c3-4c7e-a9a0-bdf7fe5083db	674e5115-eb92-4ff0-9a09-8ddc82d85b3e	d59badc6-c98c-420c-b008-4848c04add43	240	1440	2026-11-23 06:30:04.326	2026-11-25 06:30:04.326	\N	\N	\N	\N	\N	1	ON_TRACK	2026-11-21 07:50:05.294	2026-11-21 16:23:02.144	\N	\N
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (id, ticket_number, title, description, type, status, priority, impact, urgency, category_id, requester_id, assignee_id, response_due_at, resolution_due_at, first_response_at, resolved_at, closed_at, resolution_summary, created_at, updated_at, incident_id, asset_id) FROM stdin;
739518c8-7bc1-4491-9239-c0e524c23f7b	QA-TCK-1795288364917	Core Switch Fiber Link Degradation	Primary core switch encountering 15% packet loss on trunk port 0/1.	SERVICE_REQUEST	IN_PROGRESS	CRITICAL_P1	ORGANIZATION	CRITICAL	1d6d6f34-5374-42f4-a4f2-8b8f0b534271	4c175c26-6b57-42bb-baeb-aca248fc1b9c	\N	2026-11-21 19:27:44.917	2026-11-21 21:12:44.917	2026-11-21 19:12:44.937	\N	\N	\N	2026-11-21 19:12:44.919	2026-11-21 19:12:44.938	\N	\N
e81766d9-18ee-435e-982c-2cbdb7752a3a	QA-TCK-1795288442551	Core Switch Fiber Link Degradation	Primary core switch encountering 15% packet loss on trunk port 0/1.	SERVICE_REQUEST	IN_PROGRESS	CRITICAL_P1	ORGANIZATION	CRITICAL	1d6d6f34-5374-42f4-a4f2-8b8f0b534271	4c175c26-6b57-42bb-baeb-aca248fc1b9c	4c175c26-6b57-42bb-baeb-aca248fc1b9c	2026-11-21 19:29:02.551	2026-11-21 21:14:02.551	2026-11-21 19:14:02.564	\N	\N	\N	2026-11-21 19:14:02.553	2026-11-21 19:14:02.565	\N	\N
674e5115-eb92-4ff0-9a09-8ddc82d85b3e	TKT-1043	Network failure	My network connection fails 	SERVICE_REQUEST	CLOSED	MEDIUM_P3	USER	HIGH	5c8be5d7-3540-45e6-a710-06e14c6ec23d	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	2026-11-23 06:30:04.326	2026-11-25 06:30:04.326	2026-11-21 16:12:34.188	2026-11-21 16:23:02.134	2026-11-21 16:23:04.215	Issue verified and resolved.	2026-11-21 07:50:05.272	2026-11-21 16:23:10.91	\N	\N
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (user_id, role_id, assigned_at) FROM stdin;
4c175c26-6b57-42bb-baeb-aca248fc1b9c	98e2fe65-5fd1-48af-8507-73a6f9016aeb	2026-11-06 20:43:52.717
e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	bcba84ec-c1f8-4c91-8ca9-51edde8d18b2	2026-11-21 16:22:20.782
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, first_name, last_name, department, job_title, phone, status, failed_login_attempts, lockout_until, two_factor_enabled, two_factor_secret, last_login_at, created_at, updated_at) FROM stdin;
4c175c26-6b57-42bb-baeb-aca248fc1b9c	admin@serviceops.local	$argon2id$v=19$m=65536,t=3,p=1$2KKFEt7Z5uXmWVVX1OA86g$esRDyEULAChBVk5EzcnjOIvNOctiK14v6F9J9+bdnAY	System	Administrator	IT Administration	Principal Systems Administrator	\N	ACTIVE	0	\N	f	\N	2026-11-21 16:22:07.603	2026-11-06 20:43:52.712	2026-11-21 16:22:07.605
e3961fb9-fcc8-4677-9153-a12f7fcb9aa5	tharushasangeeth034@gmail.com	$argon2id$v=19$m=65536,t=3,p=1$i+YOgA4LqmPHX21lOL1QrQ$9ZkZqTJF0EpamhOum+8JhZfXVcWRxOooQ6JyvCH99zk	Tharusha	Sangeeth	Operatinal	Employee	\N	ACTIVE	0	\N	f	\N	2026-11-21 18:13:34.928	2026-11-17 19:41:44.552	2026-11-21 18:13:34.931
\.


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: incident_updates incident_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_updates
    ADD CONSTRAINT incident_updates_pkey PRIMARY KEY (id);


--
-- Name: incidents incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_pkey PRIMARY KEY (id);


--
-- Name: knowledge_articles knowledge_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_articles
    ADD CONSTRAINT knowledge_articles_pkey PRIMARY KEY (id);


--
-- Name: notification_deliveries notification_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_deliveries
    ADD CONSTRAINT notification_deliveries_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (key);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sla_policies sla_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sla_policies
    ADD CONSTRAINT sla_policies_pkey PRIMARY KEY (id);


--
-- Name: ticket_activity_logs ticket_activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_activity_logs
    ADD CONSTRAINT ticket_activity_logs_pkey PRIMARY KEY (id);


--
-- Name: ticket_attachments ticket_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_attachments
    ADD CONSTRAINT ticket_attachments_pkey PRIMARY KEY (id);


--
-- Name: ticket_comments ticket_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_pkey PRIMARY KEY (id);


--
-- Name: ticket_sla_snapshots ticket_sla_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_sla_snapshots
    ADD CONSTRAINT ticket_sla_snapshots_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: assets_asset_tag_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX assets_asset_tag_key ON public.assets USING btree (asset_tag);


--
-- Name: assets_assigned_to_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assets_assigned_to_id_idx ON public.assets USING btree (assigned_to_id);


--
-- Name: assets_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assets_status_idx ON public.assets USING btree (status);


--
-- Name: audit_logs_action_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_action_created_at_idx ON public.audit_logs USING btree (action, created_at);


--
-- Name: audit_logs_actor_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_actor_id_idx ON public.audit_logs USING btree (actor_id);


--
-- Name: audit_logs_module_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_module_created_at_idx ON public.audit_logs USING btree (module, created_at);


--
-- Name: categories_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_code_key ON public.categories USING btree (code);


--
-- Name: categories_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);


--
-- Name: incidents_incident_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX incidents_incident_number_key ON public.incidents USING btree (incident_number);


--
-- Name: knowledge_articles_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX knowledge_articles_slug_key ON public.knowledge_articles USING btree (slug);


--
-- Name: knowledge_articles_status_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX knowledge_articles_status_created_at_idx ON public.knowledge_articles USING btree (status, created_at);


--
-- Name: notification_deliveries_notification_id_channel_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notification_deliveries_notification_id_channel_idx ON public.notification_deliveries USING btree (notification_id, channel);


--
-- Name: notifications_recipient_id_is_read_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_recipient_id_is_read_created_at_idx ON public.notifications USING btree (recipient_id, is_read, created_at);


--
-- Name: password_reset_tokens_token_hash_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX password_reset_tokens_token_hash_key ON public.password_reset_tokens USING btree (token_hash);


--
-- Name: password_reset_tokens_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX password_reset_tokens_user_id_idx ON public.password_reset_tokens USING btree (user_id);


--
-- Name: permissions_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX permissions_name_key ON public.permissions USING btree (name);


--
-- Name: refresh_tokens_family_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX refresh_tokens_family_idx ON public.refresh_tokens USING btree (family);


--
-- Name: refresh_tokens_token_hash_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX refresh_tokens_token_hash_key ON public.refresh_tokens USING btree (token_hash);


--
-- Name: refresh_tokens_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX refresh_tokens_user_id_idx ON public.refresh_tokens USING btree (user_id);


--
-- Name: roles_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);


--
-- Name: sla_policies_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX sla_policies_name_key ON public.sla_policies USING btree (name);


--
-- Name: sla_policies_priority_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX sla_policies_priority_key ON public.sla_policies USING btree (priority);


--
-- Name: ticket_activity_logs_ticket_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ticket_activity_logs_ticket_id_idx ON public.ticket_activity_logs USING btree (ticket_id);


--
-- Name: ticket_attachments_ticket_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ticket_attachments_ticket_id_idx ON public.ticket_attachments USING btree (ticket_id);


--
-- Name: ticket_comments_ticket_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ticket_comments_ticket_id_idx ON public.ticket_comments USING btree (ticket_id);


--
-- Name: ticket_comments_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ticket_comments_type_idx ON public.ticket_comments USING btree (type);


--
-- Name: ticket_sla_snapshots_resolution_due_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ticket_sla_snapshots_resolution_due_at_idx ON public.ticket_sla_snapshots USING btree (resolution_due_at);


--
-- Name: ticket_sla_snapshots_response_due_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ticket_sla_snapshots_response_due_at_idx ON public.ticket_sla_snapshots USING btree (response_due_at);


--
-- Name: ticket_sla_snapshots_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ticket_sla_snapshots_status_idx ON public.ticket_sla_snapshots USING btree (status);


--
-- Name: ticket_sla_snapshots_ticket_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ticket_sla_snapshots_ticket_id_key ON public.ticket_sla_snapshots USING btree (ticket_id);


--
-- Name: tickets_assignee_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tickets_assignee_id_idx ON public.tickets USING btree (assignee_id);


--
-- Name: tickets_incident_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tickets_incident_id_idx ON public.tickets USING btree (incident_id);


--
-- Name: tickets_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tickets_priority_idx ON public.tickets USING btree (priority);


--
-- Name: tickets_requester_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tickets_requester_id_idx ON public.tickets USING btree (requester_id);


--
-- Name: tickets_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tickets_status_idx ON public.tickets USING btree (status);


--
-- Name: tickets_ticket_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tickets_ticket_number_key ON public.tickets USING btree (ticket_number);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: assets assets_assigned_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: incident_updates incident_updates_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_updates
    ADD CONSTRAINT incident_updates_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: incident_updates incident_updates_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_updates
    ADD CONSTRAINT incident_updates_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: incidents incidents_commander_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_commander_id_fkey FOREIGN KEY (commander_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: incidents incidents_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: knowledge_articles knowledge_articles_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_articles
    ADD CONSTRAINT knowledge_articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: knowledge_articles knowledge_articles_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_articles
    ADD CONSTRAINT knowledge_articles_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notification_deliveries notification_deliveries_notification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_deliveries
    ADD CONSTRAINT notification_deliveries_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ticket_activity_logs ticket_activity_logs_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_activity_logs
    ADD CONSTRAINT ticket_activity_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ticket_activity_logs ticket_activity_logs_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_activity_logs
    ADD CONSTRAINT ticket_activity_logs_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ticket_attachments ticket_attachments_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_attachments
    ADD CONSTRAINT ticket_attachments_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ticket_attachments ticket_attachments_uploader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_attachments
    ADD CONSTRAINT ticket_attachments_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ticket_comments ticket_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ticket_comments ticket_comments_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ticket_sla_snapshots ticket_sla_snapshots_policy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_sla_snapshots
    ADD CONSTRAINT ticket_sla_snapshots_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES public.sla_policies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ticket_sla_snapshots ticket_sla_snapshots_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_sla_snapshots
    ADD CONSTRAINT ticket_sla_snapshots_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tickets tickets_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tickets tickets_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tickets tickets_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tickets tickets_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tickets tickets_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict eaxGHL7TwrW8APnRrc2pCdneNCY9hzL51WWv9vPnEYbPGmtd12RrdkJbheAwFlS

