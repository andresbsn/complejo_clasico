BEGIN;

ALTER TABLE canchas
    ADD COLUMN IF NOT EXISTS complejo VARCHAR(20) DEFAULT 'Clasico 1';

-- Las canchas existentes se conservan y quedan inicialmente en Clasico 1.
-- No se eliminan canchas, turnos, reservas ni pagos.
UPDATE canchas
SET complejo = 'Clasico 1'
WHERE complejo IS NULL OR BTRIM(complejo) = '';

ALTER TABLE canchas
    ALTER COLUMN complejo SET DEFAULT 'Clasico 1',
    ALTER COLUMN complejo SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'canchas_complejo_check'
          AND conrelid = 'canchas'::regclass
    ) THEN
        ALTER TABLE canchas
            ADD CONSTRAINT canchas_complejo_check
            CHECK (complejo IN ('Clasico 1', 'Clasico 2'));
    END IF;
END $$;

COMMIT;
