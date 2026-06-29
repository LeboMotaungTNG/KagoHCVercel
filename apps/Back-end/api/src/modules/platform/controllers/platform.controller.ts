import { Request, Response } from 'express';
import crypto from 'crypto';
import Company from '../../company/models/Company';
import CompanyInvite from '../models/CompanyInvite';

// ── POST /platform/companies ─────────────────────────────────────────────────
// Creates a company shell with no owner yet and generates an invite token
// for the person who will become the owner.
// Only callable by platform_admin.
export const createCompany = async (req: Request, res: Response) => {
  try {
    const { companyName, ownerEmail, country } = req.body;
    const platformAdminId = (req as any).user?._id;

    if (!companyName || !ownerEmail) {
      return res.status(400).json({
        success: false,
        message: 'companyName and ownerEmail are required',
      });
    }

    // Prevent duplicate pending invites for the same email
    const existingInvite = await CompanyInvite.findOne({
      email: ownerEmail.toLowerCase(),
      used: false,
      expiresAt: { $gt: new Date() },
    });
    if (existingInvite) {
      return res.status(409).json({
        success: false,
        message: `An active invite already exists for ${ownerEmail}. Use the resend endpoint to refresh it.`,
      });
    }

    // Create the company shell — no ownerId yet
    const company = await Company.create({
      name: companyName,
      inviteEmail: ownerEmail.toLowerCase(),
      country: country || '',
      status: 'pending_owner',
      verified: false,
      onboardingCompleted: false,
    });

    // Generate a secure random token (64 hex chars = 256 bits)
    const token = crypto.randomBytes(32).toString('hex');

    // Invite expires in 48 hours
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await CompanyInvite.create({
      companyId: company._id,
      email: ownerEmail.toLowerCase(),
      token,
      expiresAt,
      createdBy: platformAdminId,
    });

    // In production, send the invite link by email here.
    // For now the token is returned in the response so the platform admin
    // can share it manually (e.g. paste into an email or WhatsApp).
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${token}`;

    return res.status(201).json({
      success: true,
      message: `Company created. Share the invite link with ${ownerEmail}.`,
      data: {
        company: {
          id: company._id,
          name: company.name,
          status: company.status,
          inviteEmail: company.inviteEmail,
        },
        invite: {
          token,
          inviteLink,
          expiresAt,
        },
      },
    });
  } catch (error: any) {
    console.error('createCompany error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /platform/companies ──────────────────────────────────────────────────
// Lists all companies across the platform with their current status.
// Only callable by platform_admin.
export const listCompanies = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status) filter.status = status;

    const companies = await Company.find(filter)
      .sort({ createdAt: -1 })
      .select('name inviteEmail status verified onboardingCompleted country createdAt ownerId');

    // Attach invite expiry info for pending companies
    const companyIds = companies
      .filter(c => c.status === 'pending_owner')
      .map(c => c._id);

    const invites = await CompanyInvite.find({
      companyId: { $in: companyIds },
      used: false,
    }).select('companyId expiresAt');

    const inviteMap: Record<string, Date> = {};
    invites.forEach(inv => {
      inviteMap[inv.companyId.toString()] = inv.expiresAt;
    });

    const data = companies.map(c => ({
      id: c._id,
      name: c.name,
      inviteEmail: c.inviteEmail,
      status: c.status,
      verified: c.verified,
      onboardingCompleted: c.onboardingCompleted,
      country: c.country,
      createdAt: c.createdAt,
      hasOwner: !!c.ownerId,
      inviteExpiresAt: inviteMap[c._id.toString()] || null,
    }));

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('listCompanies error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /platform/companies/:companyId/resend-invite ────────────────────────
// Invalidates the old invite token and issues a fresh one (new 48h window).
// Only callable by platform_admin.
export const resendInvite = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const platformAdminId = (req as any).user?._id;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    if (company.status !== 'pending_owner') {
      return res.status(400).json({
        success: false,
        message: 'Company already has an owner. Cannot resend invite.',
      });
    }

    // Expire all previous unused tokens for this company
    await CompanyInvite.updateMany(
      { companyId, used: false },
      { $set: { used: true, usedAt: new Date() } }
    );

    // Issue a fresh token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await CompanyInvite.create({
      companyId: company._id,
      email: company.inviteEmail,
      token,
      expiresAt,
      createdBy: platformAdminId,
    });

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${token}`;

    return res.json({
      success: true,
      message: `New invite link generated for ${company.inviteEmail}.`,
      data: { token, inviteLink, expiresAt },
    });
  } catch (error: any) {
    console.error('resendInvite error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
