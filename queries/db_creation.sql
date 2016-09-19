-- Table: public.alerts

-- DROP TABLE public.alerts;

CREATE TABLE public.alerts
(
  uuid uuid NOT NULL,
  city text,
  type text,
  subtype text,
  street text,
  "roadType" integer,
  confidence integer,
  reliability integer,
  "reportRating" integer,
  magvar integer,
  geom geometry(Point,4326),
  "timestamp" timestamp with time zone,
  CONSTRAINT "PK" PRIMARY KEY (uuid)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.alerts
  OWNER TO postgres;
  
-- Table: public.irregularities

-- DROP TABLE public.irregularities;

CREATE TABLE public.irregularities
(
  id bigint NOT NULL,
  city text,
  type text,
  street text,
  "endNode" text,
  "jamLevel" integer,
  speed double precision,
  "regularSpeed" double precision,
  accuracy integer,
  severity integer,
  "driversCount" integer,
  seconds integer,
  "delaySeconds" integer,
  length integer,
  highway boolean,
  "alertsCount" integer,
  geom geometry(LineString,4326),
  "detectionTime" timestamp with time zone,
  "updateTime" timestamp with time zone,
  CONSTRAINT "PK_irr" PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.irregularities
  OWNER TO postgres;

-- Table: public.jams

-- DROP TABLE public.jams;

CREATE TABLE public.jams
(
  uuid uuid NOT NULL,
  city text,
  type text,
  "turnType" text,
  street text,
  "endNode" text,
  "roadType" integer,
  speed double precision,
  delay integer,
  length integer,
  level integer,
  geom geometry(LineString,4326),
  "blockingAlertUuid" uuid,
  "timestamp" timestamp with time zone,
  CONSTRAINT "PK_jam" PRIMARY KEY (uuid),
  CONSTRAINT "FK_alerts" FOREIGN KEY ("blockingAlertUuid")
      REFERENCES public.alerts (uuid) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.jams
  OWNER TO postgres;

-- Index: public."FKI_alerts"

-- DROP INDEX public."FKI_alerts";

CREATE INDEX "FKI_alerts"
  ON public.jams
  USING btree
  ("blockingAlertUuid");

