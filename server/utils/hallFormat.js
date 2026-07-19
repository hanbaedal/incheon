"use strict";

function resolveHall(hallOrUsage) {
  if (!hallOrUsage) return null;
  if (hallOrUsage.name && hallOrUsage.code) return hallOrUsage;
  if (hallOrUsage.hallId && hallOrUsage.hallId.name) return hallOrUsage.hallId;
  return null;
}

function hallToCatalogJSON(hall) {
  return {
    id: hall._id,
    code: hall.code,
    name: hall.name,
    hallNumber: hall.name,
    specCode: hall.specCode,
    specLabel: hall.specLabel || "",
    areaLabel: hall.areaLabel,
    capacity: hall.capacity,
    feature: hall.feature,
    sortOrder: hall.sortOrder,
    isVirtual: hall.isVirtual,
    active: hall.active,
    createdAt: hall.createdAt,
    updatedAt: hall.updatedAt,
  };
}

function hallToAdminJSON(hall) {
  return hallToCatalogJSON(hall);
}

function usageToPublicJSON(usage, hall) {
  const h = resolveHall(hall || usage);
  return {
    id: usage._id,
    hallUsageId: usage._id,
    hallId: h ? h._id : usage.hallId,
    hallNumber: h ? h.name : "",
    hallCode: h ? h.code : "",
    specCode: h ? h.specCode : "",
    specLabel: h ? h.specLabel : "",
    feature: h ? h.feature : "",
    areaLabel: h ? h.areaLabel : "",
    capacity: h ? h.capacity : "",
    deceasedName: usage.deceasedName,
    chiefMourner: usage.chiefMourner,
    relationship: usage.relationship,
    funeralDate: usage.funeralDate,
    funeralTime: usage.funeralTime,
    burialSite: usage.burialSite,
    status: usage.status === "active" ? "in-use" : usage.status,
    updatedAt: usage.updatedAt,
  };
}

function usageToAdminJSON(usage, hall, family) {
  const h = resolveHall(hall || usage);
  return {
    id: usage._id,
    hallId: h ? h._id : usage.hallId,
    hall: h
      ? {
          id: h._id,
          code: h.code,
          name: h.name,
          specCode: h.specCode,
          specLabel: h.specLabel,
          feature: h.feature,
          areaLabel: h.areaLabel,
          capacity: h.capacity,
          isVirtual: h.isVirtual,
        }
      : null,
    familyUserId: usage.familyUserId,
    family: family
      ? { id: family._id, name: family.name, username: family.username, phone: family.phone }
      : null,
    hallRequestId: usage.hallRequestId,
    deceasedName: usage.deceasedName,
    chiefMourner: usage.chiefMourner,
    relationship: usage.relationship,
    age: usage.age,
    enshrinedAt: usage.enshrinedAt,
    funeralDate: usage.funeralDate,
    funeralTime: usage.funeralTime,
    burialSite: usage.burialSite,
    status: usage.status,
    familyCode: usage.familyCode,
    createdAt: usage.createdAt,
    updatedAt: usage.updatedAt,
  };
}

function usageToHallSummary(usage, hall) {
  const h = resolveHall(hall || usage);
  if (!usage) return null;
  return {
    id: usage._id,
    hallUsageId: usage._id,
    hallNumber: h ? h.name : "",
    hallCode: h ? h.code : "",
    specLabel: h ? h.specLabel : "",
    deceasedName: usage.deceasedName,
    chiefMourner: usage.chiefMourner,
    feature: h ? h.feature : "",
  };
}

module.exports = {
  hallToCatalogJSON,
  hallToAdminJSON,
  usageToPublicJSON,
  usageToAdminJSON,
  usageToHallSummary,
};
