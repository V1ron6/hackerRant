-- hackerRant schema (generated from the Sequelize models; Postgres). Safe on an empty database only.
CREATE TYPE enum_chats_type AS ENUM (
    'dm'
);
CREATE TYPE enum_complaints_status AS ENUM (
    'open',
    'resolved'
);
CREATE TYPE enum_otp_store_purpose AS ENUM (
    'register',
    'ticket_reset',
    'device_link'
);
CREATE TYPE enum_status_posts_kind AS ENUM (
    'text',
    'image',
    'video',
    'audio'
);
CREATE TYPE enum_users_status AS ENUM (
    'active',
    'suspended',
    'deleted'
);
CREATE TABLE audit_logs (
    id character(36) NOT NULL,
    user_id character(36),
    action character varying(100),
    metadata json,
    created_at timestamp with time zone NOT NULL
);
CREATE TABLE chat_members (
    chat_id character(36) NOT NULL,
    user_id character(36) NOT NULL,
    last_read_at timestamp with time zone
);
CREATE TABLE chats (
    id character(36) NOT NULL,
    type enum_chats_type DEFAULT 'dm'::enum_chats_type,
    dm_key character varying(80) NOT NULL,
    created_at timestamp with time zone NOT NULL
);
CREATE TABLE complaints (
    id character(36) NOT NULL,
    user_id character(36) NOT NULL,
    subject character varying(120) NOT NULL,
    message text NOT NULL,
    status enum_complaints_status DEFAULT 'open'::enum_complaints_status NOT NULL,
    created_at timestamp with time zone NOT NULL
);
CREATE TABLE messages (
    id character(36) NOT NULL,
    chat_id character(36) NOT NULL,
    sender_id character(36) NOT NULL,
    text text NOT NULL,
    created_at timestamp with time zone NOT NULL
);
CREATE TABLE otp_store (
    id character(36) NOT NULL,
    target character varying(100) NOT NULL,
    otp_hash character varying(255) NOT NULL,
    purpose enum_otp_store_purpose,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false
);
CREATE TABLE resources (
    id character(36) NOT NULL,
    title character varying(120) NOT NULL,
    url character varying(500) NOT NULL,
    description character varying(300),
    category character varying(50) DEFAULT 'General'::character varying NOT NULL,
    created_at timestamp with time zone NOT NULL
);
CREATE TABLE sessions (
    id character(36) NOT NULL,
    user_id character(36) NOT NULL,
    fingerprint character varying(255) NOT NULL,
    user_agent text,
    ip_address character varying(45),
    last_active_at timestamp with time zone,
    is_revoked boolean DEFAULT false
);
CREATE TABLE status_posts (
    id character(36) NOT NULL,
    user_id character(36) NOT NULL,
    kind enum_status_posts_kind NOT NULL,
    text text,
    media_url character varying(500),
    created_at timestamp with time zone NOT NULL
);
CREATE TABLE thread_replies (
    id character(36) NOT NULL,
    thread_id character(36) NOT NULL,
    user_id character(36) NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone NOT NULL
);
CREATE TABLE threads (
    id character(36) NOT NULL,
    owner_id character(36) NOT NULL,
    title character varying(150) NOT NULL,
    body text NOT NULL,
    is_open boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone NOT NULL
);
CREATE TABLE tickets (
    id character(36) NOT NULL,
    user_id character(36) NOT NULL,
    token_hash character varying(255) NOT NULL,
    fingerprint character varying(255) NOT NULL,
    partial_ip character varying(45),
    expires_at timestamp with time zone NOT NULL,
    is_blacklisted boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL
);
CREATE TABLE user_settings (
    user_id character(36) NOT NULL,
    notifications boolean DEFAULT true NOT NULL,
    chat_theme character varying(20) DEFAULT 'default'::character varying NOT NULL,
    share_location boolean DEFAULT false NOT NULL
);
CREATE TABLE users (
    id character(36) NOT NULL,
    username character varying(30) NOT NULL,
    first_name character varying(50),
    last_name character varying(50),
    email character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    password_hash character varying(255) NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    dob date,
    bio text,
    avatar_url character varying(300),
    latitude numeric(10,8),
    longitude numeric(11,8),
    status enum_users_status DEFAULT 'active'::enum_users_status,
    created_at timestamp with time zone NOT NULL
);
ALTER TABLE ONLY audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY chat_members
    ADD CONSTRAINT chat_members_pkey PRIMARY KEY (chat_id, user_id);
ALTER TABLE ONLY chats
    ADD CONSTRAINT chats_dm_key_key UNIQUE (dm_key);
ALTER TABLE ONLY chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);
ALTER TABLE ONLY complaints
    ADD CONSTRAINT complaints_pkey PRIMARY KEY (id);
ALTER TABLE ONLY messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY otp_store
    ADD CONSTRAINT otp_store_pkey PRIMARY KEY (id);
ALTER TABLE ONLY resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);
ALTER TABLE ONLY sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY status_posts
    ADD CONSTRAINT status_posts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY thread_replies
    ADD CONSTRAINT thread_replies_pkey PRIMARY KEY (id);
ALTER TABLE ONLY threads
    ADD CONSTRAINT threads_pkey PRIMARY KEY (id);
ALTER TABLE ONLY tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);
ALTER TABLE ONLY tickets
    ADD CONSTRAINT tickets_token_hash_key UNIQUE (token_hash);
ALTER TABLE ONLY user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY users
    ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);
ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY users
    ADD CONSTRAINT users_username_key UNIQUE (username);
CREATE INDEX chat_members_user_id ON chat_members USING btree (user_id);
CREATE INDEX complaints_user_id ON complaints USING btree (user_id);
CREATE INDEX messages_chat_id_created_at ON messages USING btree (chat_id, created_at);
CREATE INDEX status_posts_created_at ON status_posts USING btree (created_at);
CREATE INDEX thread_replies_thread_id_created_at ON thread_replies USING btree (thread_id, created_at);
CREATE INDEX threads_created_at ON threads USING btree (created_at);
ALTER TABLE ONLY audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY chat_members
    ADD CONSTRAINT chat_members_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES chats(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY chat_members
    ADD CONSTRAINT chat_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY complaints
    ADD CONSTRAINT complaints_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE;
ALTER TABLE ONLY messages
    ADD CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES chats(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id) ON UPDATE CASCADE;
ALTER TABLE ONLY sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY status_posts
    ADD CONSTRAINT status_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE;
ALTER TABLE ONLY thread_replies
    ADD CONSTRAINT thread_replies_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES threads(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY thread_replies
    ADD CONSTRAINT thread_replies_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE;
ALTER TABLE ONLY threads
    ADD CONSTRAINT threads_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users(id) ON UPDATE CASCADE;
ALTER TABLE ONLY tickets
    ADD CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY user_settings
    ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
