

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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_table_columns"("table_name" "text") RETURNS TABLE("column_name" "text", "data_type" "text", "is_nullable" "text")
    LANGUAGE "sql" SECURITY DEFINER
    AS $_$
  SELECT 
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text
  FROM information_schema.columns c
  WHERE c.table_name = $1
  ORDER BY c.ordinal_position;
$_$;


ALTER FUNCTION "public"."get_table_columns"("table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_deal_usage"("deal_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE deals 
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = deal_id;
END;
$$;


ALTER FUNCTION "public"."increment_deal_usage"("deal_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."about_us_content" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "content" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."about_us_content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deal_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "customer_email" character varying(255) NOT NULL,
    "order_id" "uuid",
    "discount_amount" numeric(10,2) NOT NULL,
    "used_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."deal_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying(50) NOT NULL,
    "description" "text" NOT NULL,
    "discount_type" character varying(20) NOT NULL,
    "discount_value" numeric(10,2) NOT NULL,
    "minimum_order_amount" numeric(10,2),
    "maximum_discount_amount" numeric(10,2),
    "usage_limit" integer,
    "usage_count" integer DEFAULT 0 NOT NULL,
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "deals_discount_type_check" CHECK ((("discount_type")::"text" = ANY ((ARRAY['percentage'::character varying, 'fixed_amount'::character varying])::"text"[]))),
    CONSTRAINT "deals_discount_value_check" CHECK (("discount_value" > (0)::numeric))
);


ALTER TABLE "public"."deals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."faqs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."faqs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inch_filling_content" (
    "id" integer NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inch_filling_content" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."inch_filling_content_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."inch_filling_content_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."inch_filling_content_id_seq" OWNED BY "public"."inch_filling_content"."id";



CREATE TABLE IF NOT EXISTS "public"."laser_cryogen_content" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "content" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."laser_cryogen_content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."non_flammable_propellant_content" (
    "id" integer NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."non_flammable_propellant_content" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."non_flammable_propellant_content_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."non_flammable_propellant_content_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."non_flammable_propellant_content_id_seq" OWNED BY "public"."non_flammable_propellant_content"."id";



CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "product_id" "text" NOT NULL,
    "product_name" "text" NOT NULL,
    "product_description" "text",
    "product_image" "text",
    "product_clientpathurl" "text",
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" numeric(10,2) DEFAULT 0 NOT NULL,
    "total_price" numeric(10,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deal_id" "uuid",
    "deal_code" character varying(50),
    "discount_amount" numeric(10,2) DEFAULT 0
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stripe_session_id" "text",
    "stripe_payment_intent_id" "text",
    "customer_email" "text" NOT NULL,
    "customer_name" "text",
    "customer_phone" "text",
    "shipping_line1" "text",
    "shipping_line2" "text",
    "shipping_city" "text",
    "shipping_state" "text",
    "shipping_postal_code" "text",
    "shipping_country" "text",
    "billing_line1" "text",
    "billing_line2" "text",
    "billing_city" "text",
    "billing_state" "text",
    "billing_postal_code" "text",
    "billing_country" "text",
    "subtotal" numeric(10,2) NOT NULL,
    "shipping_cost" numeric(10,2) DEFAULT 0,
    "tax_amount" numeric(10,2) DEFAULT 0,
    "total_amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'usd'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "shipped_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "deal_id" "uuid",
    "deal_code" character varying(50),
    "discount_amount" numeric(10,2) DEFAULT 0,
    "deals_applied" "text",
    "order_number" character varying(50),
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'shipped'::"text", 'delivered'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_price_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "stripe_price_id" "text" NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_price_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "unit_price" numeric(10,2) NOT NULL,
    "thumbnail_url" "text",
    "category" character varying(100),
    "about_url" "text",
    "clientpathurl" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "assigned_deal_id" "uuid",
    "deal_assigned_at" timestamp with time zone,
    "deal_assigned_by" "uuid",
    "deal_code" character varying(50),
    "deal_description" "text",
    "deal_discount_type" character varying(20),
    "deal_discount_value" numeric(10,2),
    "deal_minimum_order_amount" numeric(10,2),
    "deal_maximum_discount_amount" numeric(10,2),
    "deal_usage_limit" integer,
    "deal_usage_count" integer DEFAULT 0,
    "deal_expires_at" timestamp with time zone,
    "deal_is_active" boolean DEFAULT false,
    "deal_id" "uuid",
    CONSTRAINT "products_deal_discount_type_check" CHECK ((("deal_discount_type")::"text" = ANY ((ARRAY['percentage'::character varying, 'fixed_amount'::character varying])::"text"[]))),
    CONSTRAINT "products_unit_price_check" CHECK (("unit_price" > (0)::numeric))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON COLUMN "public"."products"."deal_id" IS 'Optional reference to a deal/promotion for this product';



CREATE OR REPLACE VIEW "public"."products_with_deals" WITH ("security_invoker"='on') AS
 SELECT "p"."id",
    "p"."name",
    "p"."description",
    "p"."unit_price",
    "p"."thumbnail_url",
    "p"."category",
    "p"."about_url",
    "p"."clientpathurl",
    "p"."created_at",
    "p"."updated_at",
    "p"."assigned_deal_id",
    "p"."deal_assigned_at",
    "p"."deal_assigned_by",
    "p"."deal_code",
    "p"."deal_description",
    "p"."deal_discount_type",
    "p"."deal_discount_value",
    "p"."deal_minimum_order_amount",
    "p"."deal_maximum_discount_amount",
    "p"."deal_usage_limit",
    "p"."deal_usage_count",
    "p"."deal_expires_at",
    "p"."deal_is_active",
    "d"."code" AS "assigned_deal_code",
    "d"."description" AS "assigned_deal_description",
    "d"."discount_type" AS "assigned_discount_type",
    "d"."discount_value" AS "assigned_discount_value",
    "d"."minimum_order_amount" AS "assigned_minimum_order_amount",
    "d"."maximum_discount_amount" AS "assigned_maximum_discount_amount",
    "d"."usage_limit" AS "assigned_usage_limit",
    "d"."usage_count" AS "assigned_usage_count",
    "d"."expires_at" AS "assigned_deal_expires_at",
    "d"."is_active" AS "assigned_deal_is_active",
    COALESCE("p"."deal_code", "d"."code") AS "effective_deal_code",
    COALESCE("p"."deal_description", "d"."description") AS "effective_deal_description",
    COALESCE("p"."deal_discount_type", "d"."discount_type") AS "effective_discount_type",
    COALESCE("p"."deal_discount_value", "d"."discount_value") AS "effective_discount_value",
    COALESCE("p"."deal_minimum_order_amount", "d"."minimum_order_amount") AS "effective_minimum_order_amount",
    COALESCE("p"."deal_maximum_discount_amount", "d"."maximum_discount_amount") AS "effective_maximum_discount_amount",
    COALESCE("p"."deal_usage_limit", "d"."usage_limit") AS "effective_usage_limit",
    COALESCE("p"."deal_usage_count", "d"."usage_count") AS "effective_usage_count",
    COALESCE("p"."deal_expires_at", "d"."expires_at") AS "effective_deal_expires_at",
    COALESCE("p"."deal_is_active", "d"."is_active") AS "effective_deal_is_active"
   FROM ("public"."products" "p"
     LEFT JOIN "public"."deals" "d" ON (("p"."assigned_deal_id" = "d"."id")));


ALTER TABLE "public"."products_with_deals" OWNER TO "postgres";


COMMENT ON VIEW "public"."products_with_deals" IS 'Products with both assigned deals and product-specific deals. Product-specific deals take precedence over assigned deals. Effective fields show the final values to use.';



CREATE TABLE IF NOT EXISTS "public"."twenty_mm_filling_content" (
    "id" integer NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."twenty_mm_filling_content" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."twenty_mm_filling_content_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."twenty_mm_filling_content_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."twenty_mm_filling_content_id_seq" OWNED BY "public"."twenty_mm_filling_content"."id";



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "role" "text" DEFAULT 'customer'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'customer'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['customer'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."inch_filling_content" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."inch_filling_content_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."non_flammable_propellant_content" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."non_flammable_propellant_content_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."twenty_mm_filling_content" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."twenty_mm_filling_content_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."about_us_content"
    ADD CONSTRAINT "about_us_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_usage"
    ADD CONSTRAINT "deal_usage_deal_id_customer_email_order_id_key" UNIQUE ("deal_id", "customer_email", "order_id");



ALTER TABLE ONLY "public"."deal_usage"
    ADD CONSTRAINT "deal_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."faqs"
    ADD CONSTRAINT "faqs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inch_filling_content"
    ADD CONSTRAINT "inch_filling_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."laser_cryogen_content"
    ADD CONSTRAINT "laser_cryogen_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."non_flammable_propellant_content"
    ADD CONSTRAINT "non_flammable_propellant_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_order_number_key" UNIQUE ("order_number");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_stripe_session_id_key" UNIQUE ("stripe_session_id");



ALTER TABLE ONLY "public"."product_price_history"
    ADD CONSTRAINT "product_price_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."twenty_mm_filling_content"
    ADD CONSTRAINT "twenty_mm_filling_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_deal_usage_customer_email" ON "public"."deal_usage" USING "btree" ("customer_email");



CREATE INDEX "idx_deal_usage_deal_customer" ON "public"."deal_usage" USING "btree" ("deal_id", "customer_email");



CREATE INDEX "idx_deal_usage_deal_id" ON "public"."deal_usage" USING "btree" ("deal_id");



CREATE INDEX "idx_deal_usage_order_id" ON "public"."deal_usage" USING "btree" ("order_id");



CREATE INDEX "idx_deals_active" ON "public"."deals" USING "btree" ("is_active");



CREATE INDEX "idx_deals_code" ON "public"."deals" USING "btree" ("code");



CREATE INDEX "idx_deals_expires_at" ON "public"."deals" USING "btree" ("expires_at");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_order_items_product_id" ON "public"."order_items" USING "btree" ("product_id");



CREATE INDEX "idx_orders_created_at" ON "public"."orders" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_orders_customer_email" ON "public"."orders" USING "btree" ("customer_email");



CREATE INDEX "idx_orders_deal_code" ON "public"."orders" USING "btree" ("deal_code");



CREATE INDEX "idx_orders_deal_id" ON "public"."orders" USING "btree" ("deal_id");



CREATE INDEX "idx_orders_order_number" ON "public"."orders" USING "btree" ("order_number");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_orders_stripe_session" ON "public"."orders" USING "btree" ("stripe_session_id");



CREATE INDEX "idx_orders_stripe_session_id" ON "public"."orders" USING "btree" ("stripe_session_id");



CREATE INDEX "idx_products_assigned_deal_id" ON "public"."products" USING "btree" ("assigned_deal_id");



CREATE INDEX "idx_products_clientpathurl" ON "public"."products" USING "btree" ("clientpathurl");



CREATE INDEX "idx_products_deal_id" ON "public"."products" USING "btree" ("deal_id");



CREATE INDEX "idx_products_name" ON "public"."products" USING "btree" ("name");



CREATE INDEX "idx_user_roles_user_id" ON "public"."user_roles" USING "btree" ("user_id");



CREATE UNIQUE INDEX "products_deal_code_unique" ON "public"."products" USING "btree" ("deal_code") WHERE ("deal_code" IS NOT NULL);



CREATE OR REPLACE TRIGGER "update_deals_updated_at" BEFORE UPDATE ON "public"."deals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_assigned_deal_id_fkey" FOREIGN KEY ("assigned_deal_id") REFERENCES "public"."deals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_deal_assigned_by_fkey" FOREIGN KEY ("deal_assigned_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



CREATE POLICY "Admins can view all orders" ON "public"."orders" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Allow admins to manage deals" ON "public"."deals" USING ((("auth"."role"() = 'authenticated'::"text") AND (EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text"))))));



CREATE POLICY "Allow admins to read deal usage" ON "public"."deal_usage" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND (EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text"))))));



CREATE POLICY "Allow all operations" ON "public"."products" USING (true);



CREATE POLICY "Allow all operations for authenticated users" ON "public"."products" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow anonymous users to read active deals" ON "public"."deals" FOR SELECT TO "anon" USING (("is_active" = true));



CREATE POLICY "Allow authenticated users to delete deals" ON "public"."deals" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to delete products" ON "public"."products" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to insert deals" ON "public"."deals" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to insert products" ON "public"."products" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to read active deals" ON "public"."deals" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("is_active" = true)));



CREATE POLICY "Allow authenticated users to read products" ON "public"."products" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to update deals" ON "public"."deals" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to update products" ON "public"."products" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Allow insert for authenticated" ON "public"."faqs" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow order item creation" ON "public"."order_items" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow order item reads" ON "public"."order_items" FOR SELECT USING (true);



CREATE POLICY "Allow public insert to deal_usage" ON "public"."deal_usage" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public read access to deal_usage" ON "public"."deal_usage" FOR SELECT USING (true);



CREATE POLICY "Allow public to insert order_items" ON "public"."order_items" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public to insert orders" ON "public"."orders" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public to read order_items" ON "public"."order_items" FOR SELECT USING (true);



CREATE POLICY "Allow public to read orders" ON "public"."orders" FOR SELECT USING (true);



CREATE POLICY "Allow public to update orders" ON "public"."orders" FOR UPDATE USING (true);



CREATE POLICY "Allow read access for everyone" ON "public"."inch_filling_content" FOR SELECT USING (true);



CREATE POLICY "Allow read access for everyone" ON "public"."non_flammable_propellant_content" FOR SELECT USING (true);



CREATE POLICY "Allow read access for everyone" ON "public"."twenty_mm_filling_content" FOR SELECT USING (true);



CREATE POLICY "Allow read for all" ON "public"."about_us_content" FOR SELECT USING (true);



CREATE POLICY "Allow select for all" ON "public"."laser_cryogen_content" FOR SELECT USING (true);



CREATE POLICY "Allow system to insert deal usage" ON "public"."deal_usage" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow update for authenticated" ON "public"."about_us_content" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow update for authenticated" ON "public"."laser_cryogen_content" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow update for authenticated users" ON "public"."inch_filling_content" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow update for authenticated users" ON "public"."non_flammable_propellant_content" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow update for authenticated users" ON "public"."twenty_mm_filling_content" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for admins" ON "public"."deals" USING ((("auth"."role"() = 'authenticated'::"text") AND (EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text"))))));



CREATE POLICY "Enable read access for authenticated users" ON "public"."deals" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "System can insert deal usage" ON "public"."deal_usage" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can view their own data" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own deal usage" ON "public"."deal_usage" FOR SELECT USING (((("customer_email")::"text" = ("auth"."jwt"() ->> 'email'::"text")) OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Users can view their own order items" ON "public"."order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_items"."order_id") AND (("orders"."customer_email" = ("auth"."jwt"() ->> 'email'::"text")) OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"))))));



CREATE POLICY "Users can view their own orders" ON "public"."orders" FOR SELECT USING (((("auth"."jwt"() ->> 'email'::"text") = "customer_email") OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



ALTER TABLE "public"."about_us_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "deals_public_read" ON "public"."deals" FOR SELECT USING (true);



CREATE POLICY "deals_select_policy" ON "public"."deals" FOR SELECT USING (true);



CREATE POLICY "deals_write_policy" ON "public"."deals" USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."inch_filling_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."laser_cryogen_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."non_flammable_propellant_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."twenty_mm_filling_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."get_table_columns"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_table_columns"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_table_columns"("table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_deal_usage"("deal_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_deal_usage"("deal_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_deal_usage"("deal_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."about_us_content" TO "anon";
GRANT ALL ON TABLE "public"."about_us_content" TO "authenticated";
GRANT ALL ON TABLE "public"."about_us_content" TO "service_role";



GRANT ALL ON TABLE "public"."deal_usage" TO "anon";
GRANT ALL ON TABLE "public"."deal_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_usage" TO "service_role";



GRANT ALL ON TABLE "public"."deals" TO "anon";
GRANT ALL ON TABLE "public"."deals" TO "authenticated";
GRANT ALL ON TABLE "public"."deals" TO "service_role";



GRANT ALL ON TABLE "public"."faqs" TO "anon";
GRANT ALL ON TABLE "public"."faqs" TO "authenticated";
GRANT ALL ON TABLE "public"."faqs" TO "service_role";



GRANT ALL ON TABLE "public"."inch_filling_content" TO "anon";
GRANT ALL ON TABLE "public"."inch_filling_content" TO "authenticated";
GRANT ALL ON TABLE "public"."inch_filling_content" TO "service_role";



GRANT ALL ON SEQUENCE "public"."inch_filling_content_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."inch_filling_content_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."inch_filling_content_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."laser_cryogen_content" TO "anon";
GRANT ALL ON TABLE "public"."laser_cryogen_content" TO "authenticated";
GRANT ALL ON TABLE "public"."laser_cryogen_content" TO "service_role";



GRANT ALL ON TABLE "public"."non_flammable_propellant_content" TO "anon";
GRANT ALL ON TABLE "public"."non_flammable_propellant_content" TO "authenticated";
GRANT ALL ON TABLE "public"."non_flammable_propellant_content" TO "service_role";



GRANT ALL ON SEQUENCE "public"."non_flammable_propellant_content_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."non_flammable_propellant_content_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."non_flammable_propellant_content_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."product_price_history" TO "anon";
GRANT ALL ON TABLE "public"."product_price_history" TO "authenticated";
GRANT ALL ON TABLE "public"."product_price_history" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."products_with_deals" TO "anon";
GRANT ALL ON TABLE "public"."products_with_deals" TO "authenticated";
GRANT ALL ON TABLE "public"."products_with_deals" TO "service_role";



GRANT ALL ON TABLE "public"."twenty_mm_filling_content" TO "anon";
GRANT ALL ON TABLE "public"."twenty_mm_filling_content" TO "authenticated";
GRANT ALL ON TABLE "public"."twenty_mm_filling_content" TO "service_role";



GRANT ALL ON SEQUENCE "public"."twenty_mm_filling_content_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."twenty_mm_filling_content_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."twenty_mm_filling_content_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
