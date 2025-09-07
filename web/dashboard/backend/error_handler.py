import base64
import time
from stellar_sdk import Server
from stellar_sdk.exceptions import BadRequestError, NotFoundError
from stellar_sdk.xdr import TransactionResult, TransactionResultCode

def decode_stellar_error(error_xdr):
    """
    Decode Stellar error XDR to understand specific failure reasons.
    
    Args:
        error_xdr (str): Base64 encoded XDR error string
        
    Returns:
        dict: Decoded error information
    """
    if not error_xdr:
        return {"error": "No error XDR provided"}
    
    try:
        # Decode the base64 XDR
        xdr_bytes = base64.b64decode(error_xdr)
        
        # Parse the TransactionResult
        result = TransactionResult.from_xdr_bytes(xdr_bytes)
        
        # Extract error code
        result_code = result.result.code
        error_info = {
            "result_code": str(result_code),
            "inner_code": None
        }
        
        # Get more specific error information if available
        if hasattr(result.result, 'results') and result.result.results:
            # Operation-specific errors
            op_results = result.result.results
            error_info["operation_errors"] = []
            for i, op_result in enumerate(op_results):
                op_code = op_result.tr.type
                error_info["operation_errors"].append({
                    "operation_index": i,
                    "operation_type": str(op_code),
                    "code": str(op_result.tr)
                })
        elif hasattr(result.result, 'code'):
            # General transaction error
            error_info["inner_code"] = str(result.result.code)
        
        return error_info
    except Exception as e:
        return {"error": f"Failed to decode error XDR: {str(e)}"}

def check_account_balance(account_id, server_url="https://horizon-testnet.stellar.org"):
    """
    Check account balance and verify sufficient XLM for fees.
    
    Args:
        account_id (str): Stellar account ID
        server_url (str): Horizon server URL
        
    Returns:
        dict: Account balance information
    """
    try:
        server = Server(server_url)
        account = server.load_account(account_id)
        
        balances = {}
        xlm_balance = 0.0
        
        # Properly access the balances from the Account object
        for balance in account.balances:
            if balance.asset_type == "native":
                xlm_balance = float(balance.balance)
                balances["XLM"] = {
                    "balance": xlm_balance,
                }
            else:
                balances[balance.asset_code] = {
                    "balance": float(balance.balance),
                }
        
        return {
            "account_id": account_id,
            "xlm_balance": xlm_balance,
            "balances": balances,
            "sequence": account.sequence
        }
    except NotFoundError:
        return {"error": f"Account {account_id} not found on network"}
    except Exception as e:
        return {"error": f"Failed to check account balance for {account_id}: {str(e)}"}

def ensure_sufficient_fee(account_id, min_fee, server_url="https://horizon-testnet.stellar.org"):
    """
    Ensure the account has sufficient XLM for transaction fees.
    
    Args:
        account_id (str): Stellar account ID
        min_fee (int): Minimum required fee in stroops
        server_url (str): Horizon server URL
        
    Returns:
        bool: True if sufficient funds, False otherwise
    """
    balance_info = check_account_balance(account_id, server_url)
    if "error" in balance_info:
        print(f"Error checking balance: {balance_info['error']}")
        return False
    
    min_xlm_required = min_fee / 10000000.0
    
    if balance_info["xlm_balance"] >= min_xlm_required:
        return True
    else:
        print(f"Insufficient XLM balance. Required: {min_xlm_required} XLM, Available: {balance_info['xlm_balance']} XLM")
        return False