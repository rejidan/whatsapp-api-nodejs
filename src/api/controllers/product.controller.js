exports.productCreate = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key]?.productCreate(req.body)
    return res.status(201).json({ error: false, data: data })
}
exports.productUpdate = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key]?.productUpdate(req.body.id, req.body)
    return res.status(201).json({ error: false, data: data })
}
exports.productList = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key]?.productList()
    return res.status(201).json({ error: false, data: data })
}
exports.orderDetails = async (req, res) => {
    console.log(req.body);
    const data = await WhatsAppInstances[req.query.key]?.orderDetails(req.body.id, req.body.token)
    return res.status(201).json({ error: false, data: data })
}