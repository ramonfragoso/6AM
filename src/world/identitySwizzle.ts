const IDENTITY_SWIZZLE = "rgba"

type ViewDescriptor = { swizzle?: unknown }

type TexturePrototype = { createView(descriptor?: ViewDescriptor): unknown }

type WebGPUGlobals = { GPUTexture?: { prototype: TexturePrototype } }

let dropped = false

export function dropIdentitySwizzle() {
  const texture = (globalThis as WebGPUGlobals).GPUTexture?.prototype
  if (dropped || !texture) return
  dropped = true
  const createView = texture.createView
  texture.createView = function (descriptor) {
    if (descriptor?.swizzle !== IDENTITY_SWIZZLE) return createView.call(this, descriptor)
    const withoutSwizzle = { ...descriptor }
    delete withoutSwizzle.swizzle
    return createView.call(this, withoutSwizzle)
  }
}
