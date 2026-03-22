--
-- PostgreSQL database dump
--

\restrict rtS14xRdsYy4hroPIEsNJwst1J9ObuccT9hyJCzTLDpPg8psqE3yvlzt3FzdnWP

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: email_auth; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_auth (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    password_hash character varying NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    verification_token character varying,
    verification_token_expires timestamp with time zone,
    reset_token character varying,
    reset_token_expires timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.email_auth OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_achievements (
    id character varying DEFAULT 'gen_random_uuid()'::character varying NOT NULL,
    user_id character varying NOT NULL,
    achievement_id character varying NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_achievements OWNER TO postgres;

--
-- Name: user_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_progress (
    id character varying DEFAULT 'gen_random_uuid()'::character varying NOT NULL,
    user_id character varying NOT NULL,
    xp integer DEFAULT 0 NOT NULL,
    streak integer DEFAULT 1 NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    hearts integer DEFAULT 5 NOT NULL,
    total_lessons_completed integer DEFAULT 0 NOT NULL,
    completed_lessons jsonb DEFAULT '[]'::jsonb NOT NULL,
    daily_goal_xp integer DEFAULT 20 NOT NULL,
    daily_xp_earned integer DEFAULT 0 NOT NULL,
    last_activity_date character varying,
    longest_streak integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_progress OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: word_notebook; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.word_notebook (
    id character varying DEFAULT 'gen_random_uuid()'::character varying NOT NULL,
    user_id character varying NOT NULL,
    english character varying NOT NULL,
    turkish character varying NOT NULL,
    pronunciation character varying,
    example character varying,
    lesson_id integer,
    added_at timestamp with time zone DEFAULT now() NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    next_review_at timestamp with time zone,
    known boolean DEFAULT false NOT NULL
);


ALTER TABLE public.word_notebook OWNER TO postgres;

--
-- Data for Name: email_auth; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_auth (id, user_id, password_hash, is_verified, verification_token, verification_token_expires, reset_token, reset_token_expires, created_at) FROM stdin;
61fbbceb-555a-42a5-854d-05f51b1a439d	9a21a7be-c255-4445-92d1-3c92ddd55a4d	$2b$12$BDWPnkzeW3hx1Nlq1BQ1p.7YXdxqViem7hwCLflQXUkIWOiFvwpU2	f	5e0d75e8910e8830caeac9ff094fa6e79efdd4cc5899d83a2985287b31d7da83	2026-03-22 13:25:00.275+00	\N	\N	2026-03-21 13:25:00.310234+00
f1cf1607-d9ef-4c6f-9a25-f07ca03f8f38	79d99630-bd74-4f47-92cf-4fa1d5d73379	$2b$12$O.ABY/sU3vbLWm.cEjP8H.Nji4ZMJntMhq7c4pQhKI.NZ.DH6myLO	f	b4af35cf572cfbb58d6da5efea0542f9fdcac3b87b2e671db6fcbb671340c82d	2026-03-22 13:39:15.137+00	\N	\N	2026-03-21 13:39:15.168039+00
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (sid, sess, expire) FROM stdin;
ce2a3ca32493bb0252f9902eaa1d725df4fc48b8676c7cf8b4b62e7fa455fe70	{"user": {"id": "de8eafb7-e467-441d-a9b8-e8b9808a7583", "email": "test@example.com", "lastName": "Kullanıcı", "firstName": "Test", "profileImageUrl": null}, "access_token": "email-auth"}	2026-03-28 13:22:41.871
\.


--
-- Data for Name: user_achievements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_achievements (id, user_id, achievement_id, unlocked_at) FROM stdin;
\.


--
-- Data for Name: user_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_progress (id, user_id, xp, streak, level, hearts, total_lessons_completed, completed_lessons, daily_goal_xp, daily_xp_earned, last_activity_date, longest_streak, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, first_name, last_name, profile_image_url, created_at, updated_at) FROM stdin;
9a21a7be-c255-4445-92d1-3c92ddd55a4d	wizpom@ecomvelocity.shop	wizpom	\N	\N	2026-03-21 13:25:00.276665+00	2026-03-21 13:25:00.276665+00
79d99630-bd74-4f47-92cf-4fa1d5d73379	onur@commuza.forum	onur	\N	\N	2026-03-21 13:39:15.138414+00	2026-03-21 13:39:15.138414+00
\.


--
-- Data for Name: word_notebook; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.word_notebook (id, user_id, english, turkish, pronunciation, example, lesson_id, added_at, review_count, next_review_at, known) FROM stdin;
\.


--
-- Name: email_auth email_auth_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_auth
    ADD CONSTRAINT email_auth_pkey PRIMARY KEY (id);


--
-- Name: email_auth email_auth_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_auth
    ADD CONSTRAINT email_auth_user_id_unique UNIQUE (user_id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (id);


--
-- Name: user_progress user_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: word_notebook word_notebook_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.word_notebook
    ADD CONSTRAINT word_notebook_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: email_auth email_auth_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_auth
    ADD CONSTRAINT email_auth_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_achievements user_achievements_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_progress user_progress_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: word_notebook word_notebook_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.word_notebook
    ADD CONSTRAINT word_notebook_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict rtS14xRdsYy4hroPIEsNJwst1J9ObuccT9hyJCzTLDpPg8psqE3yvlzt3FzdnWP

