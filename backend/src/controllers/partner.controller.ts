import { Request, Response } from 'express';
import { PartnerService } from '../services/partner.service';

const partnerService = new PartnerService();

// ---------- Public ----------

export const getCategories = async (req: Request, res: Response) => {
  res.json(await partnerService.getCategories());
};

export const getApprovedPosts = async (req: Request, res: Response) => {
  res.json(await partnerService.getApproved(req.query.limit, req.query.offset));
};

export const submitPost = async (req: Request, res: Response) => {
  const result = await partnerService.submitPublic(req.body || {});
  res.status(201).json(result);
};

// ---------- Admin ----------

export const getAdminPosts = async (req: Request, res: Response) => {
  res.json(await partnerService.getAllForAdmin(req.query.status));
};

export const createAdminPost = async (req: Request, res: Response) => {
  res.status(201).json(await partnerService.createByAdmin(req.body || {}));
};

export const updatePost = async (req: Request, res: Response) => {
  res.json(await partnerService.update(Number(req.params.id), req.body || {}));
};

export const approvePost = async (req: Request, res: Response) => {
  res.json(await partnerService.setStatus(Number(req.params.id), 'approved'));
};

export const unpublishPost = async (req: Request, res: Response) => {
  res.json(await partnerService.setStatus(Number(req.params.id), 'pending'));
};

export const deletePost = async (req: Request, res: Response) => {
  res.json(await partnerService.remove(Number(req.params.id)));
};

export const addCategory = async (req: Request, res: Response) => {
  res.status(201).json(await partnerService.addCategory(req.body?.name));
};

export const deleteCategory = async (req: Request, res: Response) => {
  res.json(await partnerService.deleteCategory(Number(req.params.id)));
};
