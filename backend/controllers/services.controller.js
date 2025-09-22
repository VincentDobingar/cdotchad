// controllers/services.controller.js
import Service from "../models/service.model.js";

export const getServices = async (req, res) => {
  const services = await Service.find();
  res.json(services);
};

export const createService = async (req, res) => {
  const newService = new Service(req.body);
  await newService.save();
  res.status(201).json(newService);
};

export const updateService = async (req, res) => {
  const updated = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
};

export const deleteService = async (req, res) => {
  await Service.findByIdAndDelete(req.params.id);
  res.status(204).end();
};
