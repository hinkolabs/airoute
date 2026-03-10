-- Atomic credit add function: balance update + ledger insert in a single transaction
-- Used by Stripe webhook for credit topup payments

CREATE OR REPLACE FUNCTION add_credits(
  p_workspace_id          UUID,
  p_user_id               UUID,
  p_amount                INT,
  p_package_key           TEXT DEFAULT NULL,
  p_stripe_payment_intent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance     INT;
  v_new_balance INT;
BEGIN
  -- Lock row to prevent concurrent balance corruption
  SELECT balance INTO v_balance
  FROM workspace_credits
  WHERE workspace_id = p_workspace_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NO_CREDITS_ROW');
  END IF;

  v_new_balance := v_balance + p_amount;

  UPDATE workspace_credits
  SET balance = v_new_balance
  WHERE workspace_id = p_workspace_id;

  INSERT INTO credit_ledger (workspace_id, user_id, action_type, feature_key, delta, description, metadata)
  VALUES (
    p_workspace_id,
    p_user_id,
    'topup',
    COALESCE(p_package_key, 'topup'),
    p_amount,
    CASE
      WHEN p_package_key IS NOT NULL THEN '크레딧 충전: ' || p_package_key || ' (+' || p_amount || 'P)'
      ELSE '크레딧 충전 (+' || p_amount || 'P)'
    END,
    jsonb_build_object(
      'package_key', p_package_key,
      'amount', p_amount,
      'stripe_payment_intent', p_stripe_payment_intent
    )
  );

  RETURN jsonb_build_object('ok', true, 'new_balance', v_new_balance);
END;
$$;

GRANT EXECUTE ON FUNCTION add_credits(UUID, UUID, INT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_credits(UUID, UUID, INT, TEXT, TEXT) TO service_role;
