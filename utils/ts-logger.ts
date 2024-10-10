export const txLogger = (tx: any) => {
    console.table([
        {
            "From": tx.from,
            "To": tx.to,
            "Amount": 1000,
            "Transaction Hash": tx.hash,
            "gasUsed": tx.gasPrice?.mul(tx.gasLimit).toString()
        }
    ]);
}