-- Eliminar el constraint existente (si existe)
ALTER TABLE boletos DROP CONSTRAINT IF EXISTS boletos_estado_check;

-- Agregar el nuevo constraint con el estado 'perdido' incluido
ALTER TABLE boletos ADD CONSTRAINT boletos_estado_check 
  CHECK (estado IN ('pagado', 'no_pagado', 'regresado', 'perdido'));
