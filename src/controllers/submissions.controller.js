const submissionsService = require('../services/submissions.service');
const asyncHandler = require('../utils/asyncHandler');

const normaliseMenu = (menu) => {
  if (!menu) return [];
  if (Array.isArray(menu)) return menu;
  if (typeof menu === 'string') {
    return menu.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

exports.list = asyncHandler(async (req, res) => {
  const items = await submissionsService.listSubmissions(req.query.status);
  res.json({ data: items });
});

exports.get = asyncHandler(async (req, res) => {
  const item = await submissionsService.getSubmissionById(req.params.id);
  if (!item) return res.status(404).json({ error: { message: 'Submission not found' } });
  res.json({ data: item });
});

exports.create = asyncHandler(async (req, res) => {
  const payload = {
    restaurantName: req.body.restaurantName,
    category: req.body.category,
    location: req.body.location,
    priceRange: req.body.priceRange ?? '',
    recommendedMenu: normaliseMenu(req.body.recommendedMenu),
    review: req.body.review ?? '',
    submitterName: req.body.submitterName ?? '',
    submitterEmail: req.body.submitterEmail ?? '',
    status: 'pending',
  };

  const required = ['restaurantName', 'category', 'location'];
  const missing = required.find((k) => !payload[k]);
  if (missing) {
    res.status(400).json({ error: { message: `'${missing}' is required` } });
    return;
  }

  const created = await submissionsService.createSubmission(payload);
  res.status(201).json({ data: created });
});

exports.update = asyncHandler(async (req, res) => {
  const payload = {
    restaurantName: req.body.restaurantName,
    category: req.body.category,
    location: req.body.location,
    priceRange: req.body.priceRange,
    recommendedMenu: Array.isArray(req.body.recommendedMenu) ? req.body.recommendedMenu : undefined,
    review: req.body.review,
    submitterName: req.body.submitterName,
    submitterEmail: req.body.submitterEmail,
    status: req.body.status,
  };
  const updated = await submissionsService.updateSubmission(req.params.id, payload);
  if (!updated) return res.status(404).json({ error: { message: 'Submission not found' } });
  res.json({ data: updated });
});

exports.remove = asyncHandler(async (req, res) => {
  const deleted = await submissionsService.deleteSubmission(req.params.id);
  if (!deleted) return res.status(404).json({ error: { message: 'Submission not found' } });
  res.status(204).send();
});

exports.approve = asyncHandler(async (req, res) => {
  const submission = await submissionsService.getSubmissionById(req.params.id);
  if (!submission) {
    return res.status(404).json({ error: { message: 'Submission not found' } });
  }

  // Restaurant payload 생성
  const restaurantPayload = {
    id: Date.now(), // 고유 ID
    name: submission.restaurantName,
    category: submission.category,
    location: submission.location,
    priceRange: submission.priceRange || '정보 없음',
    description: submission.review || '',
    recommendedMenu: normaliseMenu(submission.recommendedMenu),
    image: submission.image || '',
  };

  // Restaurant 생성
  const createdRestaurant = await restaurantsService.createRestaurant(restaurantPayload);

  // 승인 후 Submission 삭제(또는 상태 변경)
  await submissionsService.deleteSubmission(req.params.id);

  res.status(201).json({ data: createdRestaurant });
});

