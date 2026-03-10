-- Atomic credit consume function: balance update + ledger insert in a single transaction
-- Prevents ledger/balance inconsistency under concurrent requests

CREATE OR REPLACE FUNCTION consume_credits(
  p_workspace_id UUID,
  p_user_id      UUID,
  p_feature_key  TEXT,
  p_amount       INT,
  p_description  TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance     INT;
  v_new_balance INT;
BEGIN
  -- Lock row to prevent concurrent overconsumption
  SELECT balance INTO v_balance
  FROM workspace_credits
  WHERE workspace_id = p_workspace_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NO_CREDITS_ROW');
  END IF;

  IF v_balance < p_amount THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'INSUFFICIENT_CREDITS',
      'balance', v_balance
    );
  END IF;

  v_new_balance := v_balance - p_amount;

  UPDATE workspace_credits
  SET balance = v_new_balance
  WHERE workspace_id = p_workspace_id;

  INSERT INTO credit_ledger (workspace_id, user_id, action_type, feature_key, delta, description, metadata)
  VALUES (
    p_workspace_id,
    p_user_id,
    'consume',
    p_feature_key,
    -p_amount,
    p_description,
    jsonb_build_object('feature_key', p_feature_key, 'amount', p_amount)
  );

  RETURN jsonb_build_object('ok', true, 'new_balance', v_new_balance);
END;
$$;

-- Allow authenticated users to call this function (RLS-equivalent for RPCs)
GRANT EXECUTE ON FUNCTION consume_credits(UUID, UUID, TEXT, INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION consume_credits(UUID, UUID, TEXT, INT, TEXT) TO service_role;
