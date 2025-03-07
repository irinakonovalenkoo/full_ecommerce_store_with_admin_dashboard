import prismadb from "@/lib/prismadb";
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from "next/server";

export async function POST (
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { userId } = await auth();
    const body = await req.json();

    const { 
      name,
      price,
      categoryId,
      colorId,
      sizeId,
      images,
      isFeatured,
      isArchived
     } = body;

     const { storeId } = await params; 

    if(!userId) {
      return new NextResponse("Unathenticated", { status: 401 })
    }

    if(!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    if(!images || !images.length) {
      return new NextResponse("Images are required", { status: 400 });
    }

    if(!price) {
      return new NextResponse("Price is required", { status: 400 });
    }

    if(!categoryId) {
      return new NextResponse("Category id is required", { status: 400 });
    }

    if(!colorId) {
      return new NextResponse("Color id is required", { status: 400 });
    }

    if(!sizeId) {
      return new NextResponse("Size id is required", { status: 400 });
    }

    if(!storeId) {
      return new NextResponse("Store id is required", { status: 400 });
    }

    const storeByUserId = await prismadb.store.findFirst({
      where: {
          id:storeId,
          userId
      }
    })

    if(!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    const product = await prismadb.product.create({
      data: {
          name,
          price,
          isFeatured,
          isArchived,
          categoryId,
          colorId,
          sizeId,
          storeId: storeId,
          images: {
            createMany: {
              data: [
                ...images.map((image: {url: string}) => image)
              ]
            }
          }
      }
    });

    return NextResponse.json(product);

  } catch (error) {
      console.log('[PRODUCTS_POST]', error);
      return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(
req: Request,
{ params }: { params: Promise<{ storeId: string }> }
) {
try {
    const { storeId } = await params; 
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const colorId = searchParams.get("colorId");
    const sizeId = searchParams.get("sizeId");
    const isFeatured = searchParams.get("isFeatured");

    if (!storeId) {
        return new NextResponse("Store id is required", { status: 400 })
    }

    const whereClause: Record<string, unknown> = {
        storeId: storeId,
        isArchived: false,
    };

    if (categoryId) whereClause.categoryId = categoryId;
    if (colorId) whereClause.colorId = colorId;
    if (sizeId) whereClause.sizeId = sizeId;
    if (isFeatured) whereClause.isFeatured = isFeatured === 'true';

    const products = await prismadb.product.findMany({
        where: whereClause,
        include: {
            images: true,
            category: true,
            color: true,
            size: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return NextResponse.json(products);

} catch (error) {
    console.log('[PRODUCTS_GET]', error);
    return new NextResponse("Internal error", { status: 500 })
}
}